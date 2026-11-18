"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";
import { notifyClientNewPostForApproval } from "@/lib/notifications";

const VALID_TYPES = ["imagem", "carrossel", "reels"];
const VALID_STATUSES = ["revisao_interna", "com_cliente", "ajuste_pedido", "aprovado"];

// Cria só a linha do post (sem mídia). O upload dos arquivos é feito direto
// do navegador para o Supabase Storage pelo NewPostForm (client component),
// porque a Vercel tem um limite fixo de 4.5MB no corpo da requisição de
// Server Actions — passar a mídia por aqui quebraria em fotos/vídeos reais.
export async function createPostRecord(input: {
  clientId: string;
  type: string;
  caption: string;
  scheduledDate: string | null;
  status: string;
}) {
  const { supabase, member } = await requireAgencyMember();

  if (
    !input.clientId ||
    !VALID_TYPES.includes(input.type) ||
    !VALID_STATUSES.includes(input.status)
  ) {
    throw new Error("Selecione um cliente, tipo e status válidos.");
  }

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      client_id: input.clientId,
      type: input.type,
      caption: input.caption,
      scheduled_date: input.scheduledDate,
      status: input.status,
      created_by: member.id,
    })
    .select("id, clients(auth_user_id)")
    .single();

  if (error || !post) {
    throw new Error("Não foi possível criar o post.");
  }

  if (input.status === "com_cliente") {
    const clientInfo = post.clients as unknown as { auth_user_id: string } | null;
    if (clientInfo?.auth_user_id) {
      await notifyClientNewPostForApproval(clientInfo.auth_user_id);
    }
  }

  return post.id as string;
}

export async function finalizePostCreation() {
  revalidatePath("/agencia/posts");
}

export async function changePostStatus(formData: FormData) {
  const { supabase, member } = await requireAgencyMember();

  const postId = String(formData.get("post_id") ?? "");
  const newStatus = String(formData.get("new_status") ?? "");
  const comment = String(formData.get("comment") ?? "") || null;

  const { data: post } = await supabase
    .from("posts")
    .select("status, clients(auth_user_id)")
    .eq("id", postId)
    .maybeSingle();

  if (!post) redirect("/agencia/posts");

  await supabase.from("posts").update({ status: newStatus }).eq("id", postId);

  await supabase.from("post_activity").insert({
    post_id: postId,
    actor_type: "agency",
    actor_agency_member_id: member.id,
    previous_status: post.status,
    new_status: newStatus,
    comment,
  });

  if (newStatus === "com_cliente") {
    const clientInfo = post.clients as unknown as { auth_user_id: string } | null;
    if (clientInfo?.auth_user_id) {
      await notifyClientNewPostForApproval(clientInfo.auth_user_id);
    }
  }

  revalidatePath("/agencia/posts");
  revalidatePath(`/agencia/posts/${postId}`);
  redirect(`/agencia/posts/${postId}`);
}
