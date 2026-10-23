import "server-only";

import { Resend } from "resend";
import {
  renderAccountLetter,
  renderAccountLetterText,
  type AccountLetter,
} from "@/lib/email-template";
import { logger } from "@/lib/logger";

type MailConfig = {
  apiKey: string;
  from: string;
  appUrl: string;
};

/** Public site, sender, and API key. Missing any of them means no letter is sent. */
export function readMailConfig(): MailConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "";
  const appUrl = process.env.APP_URL?.trim().replace(/\/$/, "") ?? "";
  if (!apiKey || !from || !/^https?:\/\//i.test(appUrl)) {
    return null;
  }
  return { apiKey, from, appUrl };
}

export function mailLogoUrl(appUrl: string): string {
  return `${appUrl}/logo.png`;
}

export async function deliverAccountLetter(input: {
  to: string;
  subject: string;
  letter: AccountLetter;
}): Promise<boolean> {
  const config = readMailConfig();
  if (!config) {
    logger.error("account letter skipped: mail is not configured");
    return false;
  }

  try {
    const resend = new Resend(config.apiKey);
    const { error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: renderAccountLetter(input.letter),
      text: renderAccountLetterText(input.letter),
    });
    if (error) {
      logger.error("account letter rejected", { name: error.name });
      return false;
    }
    return true;
  } catch (error) {
    logger.error("account letter failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return false;
  }
}
