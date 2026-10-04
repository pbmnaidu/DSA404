import { USER_GUIDE_CONTENT } from "./guide-content";

const escapeHtml = (value: string) => value
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;")
 .replace(/'/g, "&#039;");

const shell = (content: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>
body{font-family:Arial,'Segoe UI',sans-serif;background:#090d16;color:#f8fafc;margin:0;padding:20px;line-height:1.6}.card{max-width:680px;margin:0 auto;background:#0f172a;border:1px solid #1e293b;border-radius:16px;padding:32px;box-sizing:border-box}.logo{font-size:24px;font-weight:900;color:#38bdf8}.logo-orange{color:#f97316}h1{font-size:24px;margin:18px 0 8px;color:#f8fafc}h2{font-size:18px;color:#38bdf8;margin:28px 0 8px;border-bottom:1px solid #1e293b;padding-bottom:6px}.muted{color:#cbd5e1;font-size:14px}.feature{background:#1e293b;border-radius:10px;padding:14px 18px;margin:0 0 12px;border-left:4px solid #38bdf8}.feature p{margin:0;color:#cbd5e1;font-size:14px}.feature ul{margin:6px 0 0;padding-left:20px;color:#cbd5e1;font-size:14px}.feature li{margin:4px 0}.quote{background:linear-gradient(135deg,#0284c7,#0f172a);border:1px solid #38bdf8;border-radius:12px;padding:20px;text-align:center;margin:24px 0;color:#fbbf24;font-weight:800}.footer{margin-top:32px;font-size:12px;color:#64748b;text-align:center;border-top:1px solid #1e293b;padding-top:16px}
</style></head><body><div class="card"><div class="logo">DSA<span class="logo-orange">⁴⁰⁴</span></div>${content}<div class="footer">DSA⁴⁰⁴ · Built for structured, consistent DSA practice</div></div></body></html>`;

export function buildWelcomeEmail(displayName: string, handle?: string) {
 const name = escapeHtml(displayName || "Learner");
 const safeHandle = escapeHtml(handle || "DSA Student");
 return shell(`<h1>Welcome to DSA⁴⁰⁴, ${name}! 🚀</h1><p class="muted">Hello <strong>${name}</strong> (<span style="color:#38bdf8">${safeHandle}</span>),<br><br>Welcome to the DSA⁴⁰⁴ community! We are excited to help you prepare systematically for coding interviews and master Data Structures &amp; Algorithms.</p><div class="quote">“Set your pace. Stay consistent. Control the controllables.”</div><p class="muted">The goal is not only to solve problems. It is to master the patterns behind them, build consistency, and let your plan adapt when life happens.</p><p class="muted">Warm regards,<br><strong style="color:#38bdf8">The 404 DSA Team</strong></p>`);
}

export function buildGuideEmail() {
 const sections = USER_GUIDE_CONTENT.map((section, index) => `<h2>${index + 1}. ${escapeHtml(section.title)}</h2><div class="feature"><p>${escapeHtml(section.summary)}</p><ul>${section.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ul>${section.tips?.length ? `<p style="margin-top:8px;color:#fbbf24"><strong>Tip:</strong> ${escapeHtml(section.tips[0])}</p>` : ""}</div>`).join("");
 return shell(`<h1>Your DSA⁴⁰⁴ guide</h1><p class="muted">Use this guide any time to learn the same workflows available in the in-app Guide tab.</p>${sections}`);
}

export function buildGuideText() {
 return [
  "Your DSA⁴⁰⁴ guide",
  "",
  ...USER_GUIDE_CONTENT.flatMap((section, index) => [
   `${index + 1}. ${section.title}`,
   section.summary,
   ...section.steps.map(step => `- ${step}`),
   ...(section.tips?.length ? [`Tip: ${section.tips[0]}`] : []),
   "",
  ]),
  "- The 404 DSA Team",
 ].join("\n");
}
