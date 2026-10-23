import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { AccountLetter } from "@/lib/email-template";

type LetterFields = {
  subject: string;
  preheader: string;
  eyebrow: string;
  title: string;
  body: string;
  button: string;
  note: string;
};

export type BuiltLetter = {
  subject: string;
  letter: AccountLetter;
};

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

function letterFrom(
  locale: Locale,
  fields: LetterFields,
  href: string,
  values: Record<string, string>,
  logoUrl: string | null,
  secondary?: { label: string; href: string },
): BuiltLetter {
  const dictionary = getDictionary(locale);
  return {
    subject: fill(fields.subject, values),
    letter: {
      lang: locale,
      preheader: fill(fields.preheader, values),
      eyebrow: fields.eyebrow,
      title: fill(fields.title, values),
      paragraphs: [fill(fields.body, values)],
      action: { label: fields.button, href },
      secondary,
      note: fill(fields.note, values),
      footer: `OpenDesk · ${dictionary.common.credit}`,
      logoUrl,
    },
  };
}

export function welcomeLetter(
  locale: Locale,
  input: { name: string; confirmUrl: string; logoUrl: string | null },
): BuiltLetter {
  return letterFrom(
    locale,
    getDictionary(locale).emails.welcome,
    input.confirmUrl,
    { name: input.name },
    input.logoUrl,
  );
}

export function confirmLetter(
  locale: Locale,
  input: { confirmUrl: string; logoUrl: string | null },
): BuiltLetter {
  return letterFrom(
    locale,
    getDictionary(locale).emails.confirm,
    input.confirmUrl,
    {},
    input.logoUrl,
  );
}

export function resetLetter(
  locale: Locale,
  input: { resetUrl: string; logoUrl: string | null },
): BuiltLetter {
  return letterFrom(
    locale,
    getDictionary(locale).emails.reset,
    input.resetUrl,
    {},
    input.logoUrl,
  );
}

export function passwordChangedLetter(
  locale: Locale,
  input: {
    email: string;
    signInUrl: string;
    resetUrl: string;
    logoUrl: string | null;
  },
): BuiltLetter {
  const fields = getDictionary(locale).emails.passwordChanged;
  return letterFrom(
    locale,
    fields,
    input.signInUrl,
    { email: input.email },
    input.logoUrl,
    { label: fields.secondary, href: input.resetUrl },
  );
}
