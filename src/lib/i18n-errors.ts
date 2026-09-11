import type { Dictionary } from "@/i18n/dictionary";
import { getDictionary } from "@/i18n/get-dictionary";
import { getLocale } from "@/i18n/locale";
import { applyAttachmentLimitCopy } from "@/lib/attachments";

type ErrorKey = keyof Dictionary["errors"];

export async function tErrors(): Promise<Dictionary["errors"]> {
  const locale = await getLocale();
  const errors = getDictionary(locale).errors;
  return {
    ...errors,
    fileTooLarge: applyAttachmentLimitCopy(errors.fileTooLarge),
  };
}

export async function mapZodMessage(message: string | undefined): Promise<string> {
  const errors = await tErrors();
  if (message && Object.hasOwn(errors, message)) {
    return errors[message as ErrorKey];
  }
  return errors.validation;
}
