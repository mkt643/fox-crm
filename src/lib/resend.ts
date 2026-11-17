import { Resend } from "resend";

// Usado na Fase 5 para disparar e-mail quando o status de um post muda.
export const resend = new Resend(process.env.RESEND_API_KEY);
