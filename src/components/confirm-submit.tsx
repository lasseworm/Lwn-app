"use client";

import type { ComponentProps } from "react";
import { Button } from "./ui";

/** Submit-knap, der beder om bekræftelse før handlinger, der påvirker andre brugere. */
export function ConfirmSubmit({
  confirmText,
  ...props
}: ComponentProps<typeof Button> & { confirmText?: string }) {
  return (
    <Button
      type="submit"
      {...props}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    />
  );
}
