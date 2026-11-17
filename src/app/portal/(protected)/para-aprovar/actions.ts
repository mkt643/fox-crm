"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";

export async function approvePost(formData: FormData) {
  const { client } = await requireClient();
  const postId = String(formData.get("post_id") ?? "");

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status")
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

  revalidatePath("/portal/para-aprovar");
  redirect("/portal/para-aprovar");
}

export async function requestAdjustment(formData: FormData) {
  const { client } = await requireClient();
  const postId = String(formData.get("post_id") ?? "");
  const comment = String(formData.get("comment") ?? "").trim();

  if (!comment) {
    redirect("/portal/para-aprovar?error=comentario_obrigatorio");
  }

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status")
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
    comment,
  });

  revalidatePath("/portal/para-aprovar");
  redirect("/portal/para-aprovar");
}
