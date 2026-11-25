"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { uploadEquipmentPhoto } from "@/lib/equipment/upload-photo";
import { t } from "@/i18n";
import { replaceEquipmentPhoto } from "../../actions";

/** Foto af maskinen med "Skift billede" og "Drej billedet" (kun for den, der tilføjede maskinen). */
export function PhotoControls({
  equipmentId,
  gymId,
  photoUrl,
  alt,
  canChange,
}: {
  equipmentId: string;
  gymId: string;
  photoUrl: string | null;
  alt: string;
  canChange: boolean;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(file: Blob, quarterTurns: number) {
    setBusy(true);
    setError(null);
    try {
      const path = await uploadEquipmentPhoto(gymId, file, quarterTurns);
      const res = await replaceEquipmentPhoto(equipmentId, path);
      if (!res.ok) throw new Error("replace failed");
      router.refresh();
    } catch (e) {
      console.error(e);
      setError(t.equipment.photoChangeFailed);
    } finally {
      setBusy(false);
    }
  }

  async function rotate() {
    if (!photoUrl) return;
    setBusy(true);
    try {
      const res = await fetch(photoUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await save(await res.blob(), 1);
    } catch (e) {
      console.error(e);
      setError(t.equipment.photoChangeFailed);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-2">
      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signeret URL, udløber efter 1 time
        <img
          src={photoUrl}
          alt={alt}
          className={`max-h-[70vh] w-full rounded-3xl bg-surface object-contain ${busy ? "opacity-50" : ""}`}
        />
      )}
      {canChange && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) void save(file, 0);
            }}
          />
          <div className={`grid gap-2 ${photoUrl ? "grid-cols-2" : ""}`}>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
              <Camera aria-hidden size={18} />
              {photoUrl ? t.equipment.changePhoto : t.equipment.addPhoto}
            </Button>
            {photoUrl && (
              <Button type="button" variant="secondary" disabled={busy} onClick={() => void rotate()}>
                <RotateCw aria-hidden size={18} />
                {t.equipment.rotatePhoto}
              </Button>
            )}
          </div>
          <p className="text-sm text-muted">{t.equipment.onlyEquipmentHint}</p>
          {busy && (
            <p role="status" className="text-sm text-muted">
              {t.equipment.photoChanging}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </>
      )}
    </div>
  );
}
