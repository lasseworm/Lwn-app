"use client";

import { useActionState } from "react";
import { Button, inputClass } from "@/components/ui";
import { t } from "@/i18n";
import { updateEquipment, type FormState } from "../../actions";

type Props = {
  equipment: {
    id: string;
    custom_name: string | null;
    weight_step_kg: number | null;
    extra_plate_kg: number | null;
    min_weight_kg: number | null;
    max_weight_kg: number | null;
  };
};

const fmt = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));

export function EditWeightsForm({ equipment: e }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateEquipment, {});
  const field = (name: string, label: string, value: number | null) => (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold">{label}</span>
      <input name={name} inputMode="decimal" defaultValue={fmt(value)} className={inputClass} />
    </label>
  );
  return (
    <form action={action} className="mt-3 space-y-3">
      <input type="hidden" name="id" value={e.id} />
      <div className="grid grid-cols-2 gap-3">
        {field("step", t.equipment.step, e.weight_step_kg)}
        {field("extra", t.equipment.extra, e.extra_plate_kg)}
        {field("min", t.equipment.min, e.min_weight_kg)}
        {field("max", t.equipment.max, e.max_weight_kg)}
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.equipment.customName}</span>
        <input name="customName" maxLength={80} defaultValue={e.custom_name ?? ""} placeholder={t.equipment.customNamePlaceholder} className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.saved && (
        <p role="status" className="text-sm text-muted">
          ✓ {t.equipment.saveChanges}
        </p>
      )}
      <Button type="submit" variant="dark" disabled={pending}>
        {t.equipment.saveChanges}
      </Button>
    </form>
  );
}
