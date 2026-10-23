"use client";

import { useId, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

type AdminConfirmFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
};

export function AdminConfirmForm({
  action,
  fields,
  label,
  title,
  description,
  confirmLabel,
  cancelLabel,
}: AdminConfirmFormProps) {
  const [open, setOpen] = useState(false);
  const formId = `admin-confirm-${useId().replaceAll(":", "")}`;

  return (
    <>
      <form id={formId} action={action} className="admin-confirm-form">
        {Object.entries(fields).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
        <button
          type="button"
          className="button-secondary"
          onClick={() => setOpen(true)}
        >
          {label}
        </button>
      </form>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        confirmFormId={formId}
        icon={<ConfirmMarkIcon />}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}

function ConfirmMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M12 8.2v4.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="15.8" r="0.9" fill="currentColor" />
    </svg>
  );
}
