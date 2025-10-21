// src/pages/api/contact.ts
import type { APIRoute } from "astro";
import { Resend } from "resend";

// Acest endpoint rulează doar pe server (nu-l prerenderizăm)
export const prerender = false;

// Citește cheile din .env (local) sau din Environment Variables (Vercel)
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
const EMAIL_FROM = import.meta.env.EMAIL_FROM; // ex: "Cabinet <onboarding@resend.dev>"
const EMAIL_TO = import.meta.env.EMAIL_TO;     // adresa cabinetului

// Mini util pentru HTML-escape (siguranță în email)
const esc = (s: string) =>
  s.replaceAll("&", "&amp;")
   .replaceAll("<", "&lt;")
   .replaceAll(">", "&gt;")
   .replaceAll('"', "&quot;")
   .replaceAll("'", "&#39;");

export const POST: APIRoute = async ({ request, redirect }) => {
  // Verificăm config lipsă
  if (!RESEND_API_KEY || !EMAIL_FROM || !EMAIL_TO) {
    return new Response("Mail service not configured.", { status: 500 });
  }

  // Form clasic (content-type: application/x-www-form-urlencoded | multipart/form-data)
  const form = await request.formData();

  // Honeypot: dacă e completat, ignorăm dar răspundem ca și cum ar fi ok
  const gotcha = String(form.get("_gotcha") ?? "");
  if (gotcha.trim() !== "") {
    return redirect("/multumim", 303);
  }

  const name    = String(form.get("name") ?? "").trim();
  const email   = String(form.get("email") ?? "").trim();
  const phone   = String(form.get("phone") ?? "").trim();
  const slot    = String(form.get("slot") ?? "").trim();
  const message = String(form.get("message") ?? "").trim();
  const gdpr    = form.get("gdpr"); // doar prezența bifei ne interesează

  // Validări de bază
  if (!name || !email || !message || !gdpr) {
    return new Response("Câmpuri obligatorii lipsă.", { status: 400 });
  }
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return new Response("Adresă de email invalidă.", { status: 400 });
  }

  // Conținut email (text + HTML)
  const subject = `Cerere programare – ${name}`;
  const text = [
    `Nume: ${name}`,
    `Email: ${email}`,
    phone ? `Telefon: ${phone}` : undefined,
    slot ? `Preferință interval: ${slot}` : undefined,
    `GDPR: ${gdpr ? "DA" : "NU"}`,
    "",
    "Mesaj:",
    message,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; line-height:1.6; color:#0f172a">
      <h2 style="margin:0 0 12px; font-size:18px;">Cerere programare nouă</h2>
      <table style="border-collapse:collapse; width:100%; max-width:640px">
        <tr><td style="padding:6px 0; color:#334155;">Nume:</td><td><strong>${esc(name)}</strong></td></tr>
        <tr><td style="padding:6px 0; color:#334155;">Email:</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
        ${phone ? `<tr><td style="padding:6px 0; color:#334155;">Telefon:</td><td>${esc(phone)}</td></tr>` : ""}
        ${slot ? `<tr><td style="padding:6px 0; color:#334155;">Preferință interval:</td><td>${esc(slot)}</td></tr>` : ""}
        <tr><td style="padding:6px 0; color:#334155;">GDPR:</td><td>${gdpr ? "DA" : "NU"}</td></tr>
      </table>
      <hr style="border:none; border-top:1px solid #e2e8f0; margin:16px 0" />
      <div>
        <div style="color:#334155; margin-bottom:6px;">Mesaj:</div>
        <pre style="white-space:pre-wrap; font:inherit; margin:0;">${esc(message)}</pre>
      </div>
    </div>
  `;

  try {
    const resend = new Resend(RESEND_API_KEY);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: EMAIL_TO,
      replyTo: email, // ca să poți da Reply direct către solicitant
      subject,
      text,
      html,
    });

    // Redirect frumos către pagina de mulțumire
    return redirect("/multumim", 303);
  } catch (err: any) {
    // Log doar pe server (nu expunem utilizatorului detalii)
    console.error("Resend send error:", err?.message || err);
    return new Response("A apărut o eroare la trimiterea mesajului.", { status: 500 });
  }
};
