export type AccountLetter = {
  lang: string;
  preheader: string;
  eyebrow: string;
  title: string;
  paragraphs: readonly string[];
  action: { label: string; href: string };
  secondary?: { label: string; href: string };
  note: string;
  footer: string;
  logoUrl: string | null;
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function safeHttpUrl(value: string): string {
  if (!/^https?:\/\//i.test(value)) {
    return "";
  }
  return escapeHtml(value);
}

function button(label: string, href: string, kind: "primary" | "quiet"): string {
  const url = safeHttpUrl(href);
  const text = escapeHtml(label);
  if (!url || !text) {
    return "";
  }
  const background = kind === "primary" ? "#0b7a64" : "#fffaf1";
  const color = kind === "primary" ? "#ffffff" : "#17211b";
  const border =
    kind === "primary" ? "1px solid #0b7a64" : "1px solid rgba(23,33,27,0.2)";
  return `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 12px;">
    <tr>
      <td bgcolor="${background}" style="border-radius:999px;border:${border};">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:'DM Sans','Noto Sans Armenian','Segoe UI',sans-serif;font-size:16px;font-weight:600;line-height:1;color:${color};text-decoration:none;border-radius:999px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

function logo(logoUrl: string | null): string {
  const src = logoUrl ? safeHttpUrl(logoUrl) : "";
  if (!src) {
    return "";
  }
  return `<td style="padding-right:12px;vertical-align:middle;">
    <img src="${src}" width="36" height="36" alt="" style="display:block;width:36px;height:36px;border-radius:9px;border:0;" />
  </td>`;
}

/**
 * HTML letter in the OpenDesk desk-and-paper palette.
 * The action lives on the button. The address is not printed in the layout.
 */
export function renderAccountLetter(letter: AccountLetter): string {
  const paragraphs = letter.paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-family:'DM Sans','Noto Sans Armenian','Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:#5a645c;">${escapeHtml(paragraph)}</p>`,
    )
    .join("");
  const secondary = letter.secondary
    ? button(letter.secondary.label, letter.secondary.href, "quiet")
    : "";

  return `<!doctype html>
<html lang="${escapeHtml(letter.lang)}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(letter.title)}</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=Noto+Sans+Armenian:wght@400;600;700&family=Syne:wght@700&display=swap" />
</head>
<body style="margin:0;padding:0;background:#101814;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#101814;">${escapeHtml(letter.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#101814;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
          <tr>
            <td style="padding:32px 32px 28px;background:#fffaf1;border-radius:22px;border:1px solid rgba(243,236,220,0.18);">
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 22px;">
                <tr>
                  ${logo(letter.logoUrl)}
                  <td style="vertical-align:middle;font-family:'Syne','Avenir Next','Segoe UI',sans-serif;font-size:22px;font-weight:700;letter-spacing:-0.03em;color:#17211b;">
                    Open<span style="color:#0b7a64;">Desk</span>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 26px;">
                <tr>
                  <td width="28" height="6" style="background:#2a6f9a;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="8"></td>
                  <td width="28" height="6" style="background:#c47b12;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="8"></td>
                  <td width="28" height="6" style="background:#0b7a64;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td>
                  <td width="8"></td>
                  <td width="28" height="6" style="background:#5d6a64;border-radius:99px;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:0 0 10px;font-family:'DM Sans','Noto Sans Armenian','Segoe UI',sans-serif;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#0b7a64;">${escapeHtml(letter.eyebrow)}</p>
              <h1 style="margin:0 0 16px;font-family:'Syne','Avenir Next','Segoe UI',sans-serif;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-0.04em;color:#17211b;">${escapeHtml(letter.title)}</h1>
              ${paragraphs}
              <div style="height:8px;line-height:8px;">&nbsp;</div>
              ${button(letter.action.label, letter.action.href, "primary")}
              ${secondary}
              <p style="margin:16px 0 0;font-family:'DM Sans','Noto Sans Armenian','Segoe UI',sans-serif;font-size:13px;line-height:1.5;color:#5a645c;">${escapeHtml(letter.note)}</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 12px 0;font-family:'DM Sans','Noto Sans Armenian','Segoe UI',sans-serif;font-size:12px;line-height:1.4;color:#c9c2b2;">${escapeHtml(letter.footer)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Plain-text twin for clients that do not show the designed letter. */
export function renderAccountLetterText(letter: AccountLetter): string {
  const lines = [
    letter.title,
    "",
    ...letter.paragraphs,
    "",
    `${letter.action.label}: ${letter.action.href}`,
  ];
  if (letter.secondary) {
    lines.push(`${letter.secondary.label}: ${letter.secondary.href}`);
  }
  lines.push("", letter.note, "", letter.footer);
  return lines.join("\n");
}
