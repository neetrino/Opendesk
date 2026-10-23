import { describe, expect, it } from "vitest";
import { passwordChangedLetter, welcomeLetter } from "@/lib/email-messages";
import {
  renderAccountLetter,
  renderAccountLetterText,
} from "@/lib/email-template";
import {
  createEmailToken,
  hashEmailToken,
  isEmailTokenCurrent,
  isEmailTokenShape,
} from "@/lib/email-token";

function visibleText(html: string): string {
  return html.replace(/<[^>]+>/g, " ");
}

describe("account letters", () => {
  it("keeps the address on the button and out of the visible letter", () => {
    const confirmUrl = "https://opendesk.example/verify-email?token=abc";
    const built = welcomeLetter("en", {
      name: "Ada <script>",
      confirmUrl,
      logoUrl: "https://opendesk.example/logo.png",
    });
    const html = renderAccountLetter(built.letter);
    const visible = visibleText(html);

    expect(visible).not.toMatch(/https?:\/\//);
    expect(visible).toContain("You&#39;re in, Ada &lt;script&gt;");
    expect(visible).not.toContain("<script>");
    expect(html).toContain(`href="${confirmUrl}"`);
    expect(html).toContain("Confirm email");
    expect(html).toContain("Open<span");
    expect(built.subject).toBe("Welcome to OpenDesk");
  });

  it("offers sign-in and a recovery button after a password change", () => {
    const built = passwordChangedLetter("ru", {
      email: "ada@example.com",
      signInUrl: "https://opendesk.example/login",
      resetUrl: "https://opendesk.example/forgot-password",
      logoUrl: null,
    });
    const html = renderAccountLetter(built.letter);

    expect(visibleText(html)).not.toMatch(/https?:\/\//);
    expect(html).toContain('href="https://opendesk.example/login"');
    expect(html).toContain('href="https://opendesk.example/forgot-password"');
    expect(renderAccountLetterText(built.letter)).toContain(
      "https://opendesk.example/login",
    );
  });
});

describe("email tokens", () => {
  it("stores a hash and rejects a stale token", () => {
    const token = createEmailToken();
    expect(isEmailTokenShape(token.raw)).toBe(true);
    expect(token.tokenHash).toBe(hashEmailToken(token.raw));
    expect(token.tokenHash).not.toContain(token.raw);
    expect(isEmailTokenCurrent(new Date(Date.now() + 1000), new Date())).toBe(
      true,
    );
    expect(isEmailTokenCurrent(new Date(Date.now() - 1000), new Date())).toBe(
      false,
    );
  });
});
