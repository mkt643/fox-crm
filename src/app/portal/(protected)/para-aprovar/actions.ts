"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAgencyOfClientActivity } from "@/lib/notifications";

export async function approvePost(formData: FormData) {
  const { client } = await requireClient();
  const postId = String(formData.get("post_id") ?? "");

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status, caption")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.client_id !== client.id || post.status !== "com_cliente") {
    redirect("/portal/para-aprovar");
  }

  await admin.from("posts").update({ status: "aprovado" }).eq("id", postId);
  await admin.from("post_activity").insert({
    post_id: postId,
    actor_type: "client",
    previous_status: post.status,
    new_status: "aprovado",
  });

  await notifyAgencyOfClientActivity(post.caption, "aprovado", null);

  revalidatePath("/portal/para-aprovar");
  redirect("/portal/para-aprovar");
}

export async function requestAdjustment(formData: FormData) {
  const { client } = await requireClient();
  const postId = String(formData.get("post_id") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();
  const highlightedText = String(formData.get("highlighted_text") ?? "").trim();

  if (!comment) {
    redirect("/portal/para-aprovar?error=comentario_obrigatorio");
  }

  const fullComment = highlightedText
    ? `Trecho destacado na legenda: "${highlightedText}"\n\n${comment}`
    : comment;

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status, caption")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.client_id !== client.id || post.status !== "com_cliente") {
    redirect("/portal/para-aprovar");
  }

  await admin.from("posts").update({ status: "ajuste_pedido" }).eq("id", postId);
  await admin.from("post_activity").insert({
    post_id: postId,
    actor_type: "client",
    previous_status: post.status,
    new_status: "ajuste_pedido",
    comment: fullComment,
  });

  await notifyAgencyOfClientActivity(post.caption, "ajuste_pedido", fullComment);

  revalidatePath("/portal/para-aprovar");
  redirect("/portal/para-aprovar");
}
