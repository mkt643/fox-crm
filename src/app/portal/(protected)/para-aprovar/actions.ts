"use server";

import { revalidatePath } from "next/cache";
import { requireClient } from "@/lib/auth/require";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyAgencyOfClientActivity } from "@/lib/notifications";

export async function approvePost(postId: string) {
  const { client } = await requireClient();

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status, caption")
    .eq("id", postId)
    .maybeSingle();

  if (!post || post.client_id !== client.id || post.status !== "com_cliente") {
    throw new Error("Não foi possível aprovar este post.");
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
  revalidatePath("/portal");
}

export async function requestAdjustment(input: {
  postId: string;
  generalComment: string;
  highlights: { start: number; end: number; text: string; comment: string }[];
}) {
  const { client } = await requireClient();

  const meaningfulHighlights = input.highlights.filter((h) => h.comment.trim());

  const parts: string[] = [];
  meaningfulHighlights.forEach((h, i) => {
    parts.push(`Trecho ${i + 1} — "${h.text}": ${h.comment.trim()}`);
  });
  if (input.generalComment.trim()) {
    parts.push(input.generalComment.trim());
  }
  const fullComment = parts.join("\n\n");

  if (!fullComment) {
    throw new Error("Escreva um comentário geral ou em algum trecho destacado.");
  }

  const admin = createAdminClient();
  const { data: post } = await admin
    .from("posts")
    .select("client_id, status, caption")
    .eq("id", input.postId)
    .maybeSingle();

  if (!post || post.client_id !== client.id || post.status !== "com_cliente") {
    throw new Error("Não foi possível enviar o pedido de ajuste.");
  }

  await admin.from("posts").update({ status: "ajuste_pedido" }).eq("id", input.postId);
  await admin.from("post_activity").insert({
    post_id: input.postId,
    actor_type: "client",
    previous_status: post.status,
    new_status: "ajuste_pedido",
    comment: fullComment,
    highlighted_ranges: meaningfulHighlights,
  });

  await notifyAgencyOfClientActivity(post.caption, "ajuste_pedido", fullComment);

  revalidatePath("/portal/para-aprovar");
  revalidatePath("/portal");
}
