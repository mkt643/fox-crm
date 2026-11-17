import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

const FROM = process.env.RESEND_FROM_EMAIL || "FOX <naoresponda@agenciafoxmkt.com.br>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

// Dispara quando a agência move um post para "Com o cliente".
export async function notifyClientNewPostForApproval(clientAuthUserId: string) {
  const resend = getResend();
  if (!resend) return;

  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.getUserById(clientAuthUserId);
    const email = data.user?.email;
    if (!email) return;

    await resend.emails.send({
      from: FROM,
      to: email,
      subject: "Novo post para aprovação",
      text: `Olá! Há um novo post aguardando sua aprovação no portal da FOX.\n\n${APP_URL}/portal/para-aprovar`,
    });
  } catch (err) {
    console.error("Falha ao enviar e-mail de notificação ao cliente:", err);
  }
}

// Dispara quando o cliente aprova ou pede ajuste em um post.
export async function notifyAgencyOfClientActivity(
  postCaption: string,
  newStatus: "aprovado" | "ajuste_pedido",
  comment: string | null,
) {
  const resend = getResend();
  if (!resend) return;

  try {
    const admin = createAdminClient();
    const { data: members } = await admin.from("agency_members").select("email");
    const emails = (members ?? []).map((m) => m.email).filter(Boolean);
    if (!emails.length) return;

    const actionLabel = newStatus === "aprovado" ? "aprovou um post" : "pediu ajuste em um post";
    const captionPreview = postCaption.slice(0, 80);

    await resend.emails.send({
      from: FROM,
      to: emails,
      subject: `Cliente ${actionLabel}`,
      text: [
        `O cliente ${actionLabel}: "${captionPreview}".`,
        comment ? `\nComentário: ${comment}` : "",
        `\n${APP_URL}/agencia/posts`,
      ].join(""),
    });
  } catch (err) {
    console.error("Falha ao enviar e-mail de notificação à agência:", err);
  }
}
