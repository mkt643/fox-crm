"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAgencyMember } from "@/lib/auth/require";
import { notifyClientNewPostForApproval } from "@/lib/notifications";

const VALID_TYPES = ["imagem", "carrossel", "reels"];

export async function createPost(formData: FormData) {
  const { supabase, member } = await requireAgencyMember();

  const clientId = String(formData.get("client_id") ?? "");
  const type = String(formData.get("type") ?? "");
  const caption = String(formData.get("caption") ?? "");
  const scheduledDate = String(formData.get("scheduled_date") ?? "") || null;
  const files = formData
    .getAll("media")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!clientId || !VALID_TYPES.includes(type) || files.length === 0) {
    redirect("/agencia/posts/novo?error=dados_invalidos");
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .insert({
      client_id: clientId,
      type,
      caption,
      scheduled_date: scheduledDate,
      created_by: member.id,
    })
    .select("id")
    .single();

  if (postError || !post) {
    redirect("/agencia/posts/novo?error=erro_criar_post");
  }

  for (const [index, file] of files.entries()) {
    const path = `${clientId}/${post.id}/${index}-${file.name}`;
    const buffer = await file.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("post-media")
      .upload(path, buffer, { contentType: file.type });

    if (!uploadError) {
      await supabase.from("post_media").insert({
        post_id: post.id,
        storage_path: path,
        kind: file.type.startsWith("video") ? "video" : "image",
        position: index,
      });
    }
  }

  revalidatePath("/agencia/posts");
  redirect("/agencia/posts");
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
