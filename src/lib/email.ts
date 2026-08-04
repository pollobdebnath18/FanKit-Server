import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { env } from "./env.js";

const host = env.SMTP_HOST || "smtp.gmail.com";
const port = Number(env.SMTP_PORT) || 587;
const user = env.SMTP_USER;
const pass = env.SMTP_PASS;
const from = env.EMAIL_FROM || `"FanKit" <${user}>`;

let transporter: Transporter | null = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: Number(env.SMTP_PORT) === 465,
      auth: user && pass ? { user, pass } : undefined,
    });
  }
  return transporter;
};

const smtpConfigured = Boolean(user && pass);

export const sendEmail = async (options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<boolean> => {
  if (!smtpConfigured) {
    // Dev fallback: print the email content to the server console.
    console.log(
      `\n[DEV EMAIL] To: ${options.to}\nSubject: ${options.subject}\nBody:\n${options.text}\n`,
    );
    return true;
  }

  try {
    await getTransporter().sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return true;
  } catch (err) {
    console.error("[EMAIL] Failed to send email:", err);
    return false;
  }
};
