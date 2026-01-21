import type { APIRoute } from "astro";

export const prerender = false;

const safeStr = (v: unknown, max: number) =>
  String(v ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);

const emailLooksOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const subjectMap: Record<string, string> = {
  diagnostic: "Point rapide 15 min",
  crm: "CRM simple",
  relances: "Relances automatiques (propres)",
  base: "Nettoyage / base de données",
  audit: "Audit marketing & prospection B2B",
  prospection: "Structuration prospection",
  ia: "IA raisonnée & automatisation",
  autre: "Autre",
  contact: "Contact",
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();

    // Anti-spam (honeypot)
    const website = safeStr(form.get("website"), 200);
    if (website.length > 0) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/contact?sent=1" },
      });
    }

    // Champs principaux
    const name = safeStr(form.get("name"), 120);
    const email = safeStr(form.get("email"), 180);
    const topic = safeStr(form.get("topic") || "contact", 60);
    const message = String(form.get("message") ?? "").trim().slice(0, 8000);
    const source = safeStr(form.get("source"), 200);

    // Champs optionnels
    const phone = safeStr(form.get("phone"), 60);
    const company = safeStr(form.get("company"), 120);
    const url = safeStr(form.get("url"), 300);

    // Validations minimales
    if (!name || !email || !message || !emailLooksOk(email)) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/contact?error=1" },
      });
    }

    const RESEND_API_KEY = import.meta.env.RESEND_API_KEY;
    const CONTACT_TO_EMAIL = import.meta.env.CONTACT_TO_EMAIL;

    if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
      return new Response(null, {
        status: 303,
        headers: { Location: "/contact?error=1" },
      });
    }

    const topicLabel = subjectMap[topic] ?? topic;

    // Sujet "safe" (évite caractères casse-pieds)
    const cleanName = name.replace(/[^\p{L}\p{N}\s.'-]/gu, "").trim().slice(0, 80);
    const cleanCompany = company.replace(/[^\p{L}\p{N}\s.'-]/gu, "").trim().slice(0, 60);

    const subject =
      `[UpStrategia] ${topicLabel}` +
      (cleanCompany ? ` - ${cleanCompany}` : "") +
      ` - ${cleanName || "Contact"}`;

    const lines: string[] = [
      `Nom: ${name}`,
      `Email: ${email}`,
      `Sujet: ${topicLabel} (${topic})`,
      source ? `Source: ${source}` : "",
      company ? `Entreprise: ${company}` : "",
      phone ? `Téléphone: ${phone}` : "",
      url ? `Site/LinkedIn: ${url}` : "",
      "",
      "Message:",
      message,
      "",
    ].filter(Boolean);

    const payload = {
      from: "UpStrategia <onboarding@resend.dev>",
      to: [CONTACT_TO_EMAIL],
      subject,
      // compat : certains exemples utilisent reply_to, d'autres replyTo
      replyTo: email,
      reply_to: email,
      text: lines.join("\n"),
    };

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      // On loggue côté serveur si tu as des logs Vercel, mais côté user: redir propre
      return new Response(null, {
        status: 303,
        headers: { Location: "/contact?error=1" },
      });
    }

    return new Response(null, {
      status: 303,
      headers: { Location: "/contact?sent=1" },
    });
  } catch {
    return new Response(null, {
      status: 303,
      headers: { Location: "/contact?error=1" },
    });
  }
};
