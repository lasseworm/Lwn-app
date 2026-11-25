"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, inputClass } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image";
import { validWeights } from "@/lib/equipment/weights";
import { muscleName, t } from "@/i18n";
import { addEquipment, discardPhoto, pickExistingEquipment } from "../actions";

type MachineType = {
  id: string;
  slug: string;
  name: string;
  category: string;
  is_multipurpose: boolean;
  primary_muscles: string[];
};

type Existing = {
  id: string;
  machine_type_id: string | null;
  custom_name: string | null;
  photo_path: string | null;
  updated_at: string | null;
};

type Suggestion = { slug: string | null; confidence: number; alternatives: string[]; reasoning: string };

type Step = "photo" | "type" | "duplicate" | "details";

const BUCKET = "equipment-photos";
const CATEGORY_ORDER = ["machine", "multi", "free_weight", "accessory", "cardio"];
const COMMON_STEPS = [2.5, 3.5, 4.5, 5, 7, 10];
const CONFIDENT = 0.6;

// Udstyr med vægtstak, hvor vægttrin giver mening
const needsWeights = (m: MachineType | undefined) => !!m && (m.category === "machine" || m.slug === "cable_station");

const parseKg = (s: string) => {
  const v = Number(s.replace(",", ".").trim());
  return s.trim() && Number.isFinite(v) ? v : null;
};
const fmtKg = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 2 });

async function uploadPhoto(gymId: string, file: File): Promise<string> {
  const blob = await compressImage(file);
  const path = `${gymId}/${crypto.randomUUID()}.jpg`;
  const { error } = await createClient().storage.from(BUCKET).upload(path, blob, {
    contentType: "image/jpeg",
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export function AddEquipmentWizard({
  gymId,
  mode,
  catalog,
  existing,
}: {
  gymId: string;
  mode: "off" | "mock" | "live";
  catalog: MachineType[];
  existing: Existing[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("photo");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [showList, setShowList] = useState(false);
  const [filter, setFilter] = useState("");
  const [typeId, setTypeId] = useState<string | null>(null);

  const [stepKg, setStepKg] = useState("");
  const [extraKg, setExtraKg] = useState("");
  const [minKg, setMinKg] = useState("");
  const [maxKg, setMaxKg] = useState("");
  const [customName, setCustomName] = useState("");
  const [stackNotice, setStackNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const stackRef = useRef<HTMLInputElement>(null);

  const bySlug = useMemo(() => new Map(catalog.map((m) => [m.slug, m])), [catalog]);
  const byId = useMemo(() => new Map(catalog.map((m) => [m.id, m])), [catalog]);
  const selected = typeId ? byId.get(typeId) : undefined;
  const duplicates = typeId ? existing.filter((e) => e.machine_type_id === typeId) : [];

  // -------------------------------------------------------------------------
  // Trin 1: foto
  // -------------------------------------------------------------------------

  async function resetPhoto() {
    if (photoPath) void discardPhoto(photoPath);
    setPhotoPath(null);
    setPreview(null);
  }

  async function handlePhoto(file: File | undefined) {
    if (!file) return;
    setNotice(null);
    setSuggestion(null);
    await resetPhoto();
    try {
      setBusy(t.equipment.uploading);
      const path = await uploadPhoto(gymId, file);
      setPhotoPath(path);
      setPreview(URL.createObjectURL(file));

      if (mode === "off") {
        setNotice(t.equipment.aiOff);
        setShowList(true);
        setStep("type");
        return;
      }

      setBusy(t.equipment.recognizing);
      const res = await fetch("/api/ai/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoPath: path }),
      });
      const data = await res.json();

      if (data.rejected) {
        // Serveren har allerede slettet fotoet
        setPhotoPath(null);
        setPreview(null);
        setNotice(data.rejected === "people" ? t.equipment.rejectedPeople : t.equipment.rejectedNotEquipment);
        return;
      }
      if (!data.result) {
        setNotice(data.quota === "exceeded" ? t.equipment.aiQuota : t.equipment.aiFailed);
        setShowList(true);
        setStep("type");
        return;
      }
      const r = data.result as {
        machine_type_slug: string | null;
        confidence: number;
        alternatives: string[];
        reasoning_short: string;
      };
      setSuggestion({
        slug: r.machine_type_slug,
        confidence: r.confidence,
        alternatives: r.alternatives,
        reasoning: r.reasoning_short,
      });
      setShowList(!r.machine_type_slug || r.confidence < CONFIDENT);
      if (mode === "mock") setNotice(t.equipment.aiMock);
      setStep("type");
    } catch (e) {
      console.error(e);
      setNotice(t.equipment.uploadFailed);
    } finally {
      setBusy(null);
    }
  }

  // -------------------------------------------------------------------------
  // Trin 2: type (+ dublet-tjek)
  // -------------------------------------------------------------------------

  function chooseType(id: string) {
    setTypeId(id);
    setError(null);
    const dupes = existing.filter((e) => e.machine_type_id === id);
    setStep(dupes.length > 0 ? "duplicate" : "details");
  }

  async function chooseExisting(existingId: string) {
    setBusy(t.equipment.saving);
    const res = await pickExistingEquipment(existingId, photoPath);
    setBusy(null);
    if (res.ok) router.push(`/center/udstyr/${res.id}`);
    else setError(res.error);
  }

  // -------------------------------------------------------------------------
  // Trin 3: vægttrin (+ scan af vægtstak)
  // -------------------------------------------------------------------------

  async function handleStackPhoto(file: File | undefined) {
    if (!file) return;
    setStackNotice(null);
    try {
      setBusy(t.equipment.uploading);
      const path = await uploadPhoto(gymId, file);
      setBusy(t.equipment.scanning);
      const res = await fetch("/api/ai/weight-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoPath: path }),
      });
      const data = await res.json();
      if (data.rejected) return setStackNotice(t.equipment.scanRejected);
      if (!data.result) {
        return setStackNotice(data.quota === "exceeded" ? t.equipment.scanQuota : t.equipment.scanFailed);
      }
      const r = data.result as { step_kg: number | null; extra_plate_kg: number | null; min_kg: number | null; max_kg: number | null };
      const s = (n: number | null) => (n == null ? "" : String(n).replace(".", ","));
      if (r.step_kg != null) setStepKg(s(r.step_kg));
      setExtraKg(s(r.extra_plate_kg));
      if (r.min_kg != null) setMinKg(s(r.min_kg));
      if (r.max_kg != null) setMaxKg(s(r.max_kg));
      setStackNotice(mode === "mock" ? `${t.equipment.aiMock} ${t.equipment.scanResult}` : t.equipment.scanResult);
    } catch (e) {
      console.error(e);
      setStackNotice(t.equipment.uploadFailed);
    } finally {
      setBusy(null);
    }
  }

  const weightPreview = validWeights({
    weight_step_kg: parseKg(stepKg),
    extra_plate_kg: parseKg(extraKg),
    min_weight_kg: parseKg(minKg),
    max_weight_kg: parseKg(maxKg),
  });

  async function save() {
    if (!typeId) return setError(t.equipment.errors.chooseType);
    setError(null);
    setBusy(t.equipment.saving);
    const weighted = needsWeights(selected);
    const res = await addEquipment({
      gymId,
      machineTypeId: typeId,
      photoPath,
      aiConfidence: suggestion && selected && suggestion.slug === selected.slug ? suggestion.confidence : null,
      customName,
      weightStepKg: weighted ? parseKg(stepKg) : null,
      extraPlateKg: weighted ? parseKg(extraKg) : null,
      minWeightKg: weighted ? parseKg(minKg) : null,
      maxWeightKg: weighted ? parseKg(maxKg) : null,
    });
    if (res.ok) {
      router.push(`/center/udstyr/${res.id}?ny=1`);
    } else {
      setBusy(null);
      setError(res.error);
    }
  }

  // -------------------------------------------------------------------------
  // Visning
  // -------------------------------------------------------------------------

  const filtered = catalog.filter((m) => {
    const q = filter.trim().toLowerCase();
    return !q || m.name.toLowerCase().includes(q) || m.primary_muscles.some((k) => muscleName(k).toLowerCase().includes(q));
  });

  const suggested = suggestion?.slug ? bySlug.get(suggestion.slug) : undefined;
  const alternatives = (suggestion?.alternatives ?? []).map((s) => bySlug.get(s)).filter((m): m is MachineType => !!m);
  const stepIndex = { photo: 0, type: 1, duplicate: 1, details: 2 }[step];

  return (
    <div className="space-y-5">
      <ol className="flex gap-2 text-sm font-semibold" aria-label="Trin">
        {[t.equipment.stepPhoto, t.equipment.stepType, t.equipment.stepWeights].map((label, i) => (
          <li
            key={label}
            aria-current={i === stepIndex ? "step" : undefined}
            className={`flex-1 rounded-full px-3 py-1.5 text-center ${
              i === stepIndex ? "bg-brand text-brand-foreground" : i < stepIndex ? "bg-accent/20" : "bg-surface text-muted"
            }`}
          >
            {i + 1}. {label}
          </li>
        ))}
      </ol>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- lokal forhåndsvisning (blob-URL)
        <img src={preview} alt="" className="aspect-[4/3] w-full rounded-3xl object-cover" />
      )}

      {busy && (
        <p role="status" aria-live="polite" className="flex items-center gap-3 rounded-2xl bg-surface p-4 text-base font-semibold">
          <span aria-hidden className="h-5 w-5 animate-spin rounded-full border-2 border-muted border-t-accent" />
          {busy}
        </p>
      )}

      {notice && !busy && (
        <p role="status" className="rounded-2xl border border-border bg-surface p-4 text-sm">
          {notice}
        </p>
      )}

      {/* ------------------------------------------------------------ Foto */}
      {step === "photo" && !busy && (
        <div className="space-y-4">
          <p className="text-base text-muted">{t.equipment.photoIntro}</p>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-surface p-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-6 w-6 shrink-0 accent-[var(--accent)]"
            />
            <span>
              <span className="block text-base font-semibold">{t.equipment.onlyEquipment}</span>
              <span className="block text-sm text-muted">{t.equipment.onlyEquipmentHint}</span>
            </span>
          </label>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              void handlePhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            ref={galleryRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            className="hidden"
            onChange={(e) => {
              void handlePhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <Button onClick={() => cameraRef.current?.click()} disabled={!consent}>
            {t.equipment.takePhoto}
          </Button>
          <Button variant="secondary" onClick={() => galleryRef.current?.click()} disabled={!consent}>
            {t.equipment.fromGallery}
          </Button>
          <button
            type="button"
            onClick={() => {
              setShowList(true);
              setNotice(null);
              setStep("type");
            }}
            className="min-h-12 w-full text-base font-semibold text-muted underline underline-offset-2"
          >
            {t.equipment.skipPhoto}
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------ Type */}
      {step === "type" && !busy && (
        <div className="space-y-4">
          {suggested && (
            <Card>
              <p className="text-sm font-semibold uppercase tracking-widest text-muted">
                {t.equipment.suggestion} · {t.equipment.sure(Math.round((suggestion?.confidence ?? 0) * 100))}
              </p>
              <p className="mt-1 text-2xl font-black tracking-tight">{suggested.name}</p>
              {suggestion?.reasoning && <p className="mt-1 text-sm text-muted">{suggestion.reasoning}</p>}
              <div className="mt-4 grid gap-3">
                <Button onClick={() => chooseType(suggested.id)}>{t.equipment.confirmSuggestion}</Button>
                {!showList && (
                  <Button variant="secondary" onClick={() => setShowList(true)}>
                    {t.equipment.chooseOther}
                  </Button>
                )}
              </div>
              {alternatives.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-muted">{t.equipment.alsoPossible}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alternatives.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => chooseType(m.id)}
                        className="min-h-11 rounded-full border border-border bg-background px-4 text-sm font-semibold"
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {showList && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">{t.equipment.chooseType}</h2>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={t.equipment.filterPlaceholder}
                aria-label={t.equipment.filterPlaceholder}
                className={inputClass}
              />
              {CATEGORY_ORDER.map((c) => {
                const items = filtered.filter((m) => m.category === c);
                if (!items.length) return null;
                return (
                  <div key={c}>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-widest text-muted">{t.categories[c]}</h3>
                    <Card className="p-0">
                      <ul className="divide-y divide-border">
                        {items.map((m) => (
                          <li key={m.id}>
                            <button
                              type="button"
                              onClick={() => chooseType(m.id)}
                              className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-2 text-left"
                            >
                              <span>
                                <span className="block text-base font-semibold">{m.name}</span>
                                <span className="block text-sm text-muted">
                                  {m.is_multipurpose ? t.catalog.multipurpose : m.primary_muscles.map(muscleName).join(", ")}
                                </span>
                              </span>
                              <span aria-hidden className="text-muted">›</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>
                );
              })}
            </section>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------ Dublet */}
      {step === "duplicate" && selected && !busy && (
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">{t.equipment.duplicateTitle(selected.name.toLowerCase())}</h2>
          <p className="text-base text-muted">{t.equipment.duplicateIntro}</p>
          <ul className="space-y-3">
            {duplicates.map((d, i) => (
              <li key={d.id}>
                <Button variant="dark" onClick={() => void chooseExisting(d.id)}>
                  {t.equipment.sameMachine}
                  {duplicates.length > 1 ? ` (${d.custom_name ?? `#${i + 1}`})` : d.custom_name ? ` (${d.custom_name})` : ""}
                </Button>
              </li>
            ))}
          </ul>
          <Button variant="secondary" onClick={() => setStep("details")}>
            {t.equipment.otherMachine}
          </Button>
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </Card>
      )}

      {/* ------------------------------------------------------------ Vægte og gem */}
      {step === "details" && selected && !busy && (
        <div className="space-y-4">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted">{t.categories[selected.category]}</p>
            <p className="mt-1 text-2xl font-black tracking-tight">{selected.name}</p>
            <button
              type="button"
              onClick={() => {
                setShowList(true);
                setStep("type");
              }}
              className="mt-1 min-h-11 text-sm font-semibold underline underline-offset-2"
            >
              {t.equipment.chooseOther}
            </button>
          </Card>

          {needsWeights(selected) ? (
            <Card className="space-y-4">
              <p className="text-base text-muted">{t.equipment.weightsIntro}</p>

              {mode !== "off" && (
                <>
                  <input
                    ref={stackRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      void handleStackPhoto(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  <Button variant="secondary" onClick={() => stackRef.current?.click()}>
                    {t.equipment.scanStack}
                  </Button>
                  {stackNotice && (
                    <p role="status" className="text-sm text-muted">
                      {stackNotice}
                    </p>
                  )}
                </>
              )}

              <fieldset>
                <legend className="mb-2 text-sm font-semibold">{t.equipment.step}</legend>
                <div className="flex flex-wrap gap-2">
                  {COMMON_STEPS.map((s) => {
                    const val = String(s).replace(".", ",");
                    const active = parseKg(stepKg) === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setStepKg(val)}
                        className={`min-h-11 min-w-14 rounded-full border px-4 text-base font-semibold ${
                          active ? "border-brand bg-brand text-brand-foreground" : "border-border bg-background"
                        }`}
                      >
                        {val}
                      </button>
                    );
                  })}
                </div>
                <input
                  aria-label={t.equipment.step}
                  inputMode="decimal"
                  value={stepKg}
                  onChange={(e) => setStepKg(e.target.value)}
                  className={`${inputClass} mt-3`}
                  placeholder="Andet trin, fx 6"
                />
              </fieldset>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold">{t.equipment.extra}</span>
                <input inputMode="decimal" value={extraKg} onChange={(e) => setExtraKg(e.target.value)} className={inputClass} />
                <span className="mt-1 block text-sm text-muted">{t.equipment.extraHint}</span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{t.equipment.min}</span>
                  <input inputMode="decimal" value={minKg} onChange={(e) => setMinKg(e.target.value)} className={inputClass} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-sm font-semibold">{t.equipment.max}</span>
                  <input inputMode="decimal" value={maxKg} onChange={(e) => setMaxKg(e.target.value)} className={inputClass} />
                </label>
              </div>

              {weightPreview.length > 0 && (
                <div>
                  <p className="text-sm font-semibold">{t.equipment.preview}</p>
                  <p className="mt-1 text-sm text-muted">
                    {weightPreview.slice(0, 14).map(fmtKg).join(" · ")}
                    {weightPreview.length > 14 ? " …" : ""} kg
                  </p>
                </div>
              )}
            </Card>
          ) : (
            <p className="text-base text-muted">{t.equipment.noWeightsNeeded}</p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.equipment.customName}</span>
            <input
              value={customName}
              maxLength={80}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder={t.equipment.customNamePlaceholder}
              className={inputClass}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
          <Button onClick={() => void save()}>{t.equipment.save}</Button>
        </div>
      )}
    </div>
  );
}
