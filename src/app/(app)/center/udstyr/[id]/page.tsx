import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink, Button, Card, StatusBadge } from "@/components/ui";
import { requireUser } from "@/lib/gyms";
import { PHOTO_BUCKET } from "@/lib/ai/photo";
import { validWeights } from "@/lib/equipment/weights";
import { muscleName, t } from "@/i18n";
import { confirmEquipment, reportEquipment, setEquipmentRemoved } from "../../actions";
import { EditWeightsForm } from "./edit-weights-form";
import { ConfirmSubmit } from "@/components/confirm-submit";

export const metadata: Metadata = { title: t.gym.title };

const fmtKg = (n: number) => n.toLocaleString("da-DK", { maximumFractionDigits: 2 });

export default async function EquipmentPage(props: PageProps<"/center/udstyr/[id]">) {
  const { id } = await props.params;
  const justAdded = (await props.searchParams).ny === "1";
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { supabase, user } = await requireUser();

  const { data: e } = await supabase
    .from("gym_equipment")
    .select(
      "id, gym_id, custom_name, photo_path, status, confirmations, added_by, updated_at, weight_step_kg, extra_plate_kg, min_weight_kg, max_weight_kg, gyms(name, created_by), machine_types(slug, name, category, primary_muscles, is_multipurpose)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!e) notFound();

  const { data: myVote } = await supabase
    .from("equipment_confirmations")
    .select("vote")
    .eq("equipment_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  let photoUrl: string | null = null;
  if (e.photo_path) {
    const { data } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(e.photo_path, 3600);
    photoUrl = data?.signedUrl ?? null;
  }

  const mt = e.machine_types;
  const status = e.status ?? "pending";
  const removed = status === "removed";
  const canConfirm = !removed && (e.added_by !== user.id || e.gyms?.created_by === user.id) && myVote?.vote !== "confirm";
  const weights = validWeights(e);

  return (
    <main className="space-y-5">
      <BackLink href="/center" label={e.gyms?.name ?? t.gym.title} />

      {justAdded && (
        <p role="status" className="rounded-2xl border border-accent/50 bg-accent/15 p-4 text-sm">
          ✓ {t.equipment.savedPending}
        </p>
      )}

      {photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- signeret URL, udløber efter 1 time
        <img src={photoUrl} alt={mt?.name ?? ""} className="aspect-[4/3] w-full rounded-3xl object-cover" />
      )}

      <header>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold uppercase tracking-widest text-muted">
            {t.categories[mt?.category ?? ""] ?? mt?.category}
          </span>
          <StatusBadge status={status} label={t.equipment.status[status]} />
        </div>
        <h1 className="mt-1 text-3xl font-black tracking-tight">{mt?.name}</h1>
        {e.custom_name && <p className="mt-1 text-base text-muted">{e.custom_name}</p>}
        <p className="mt-1 text-sm text-muted">
          {!mt?.is_multipurpose && (mt?.primary_muscles ?? []).map(muscleName).join(", ")}
          {!mt?.is_multipurpose && " · "}
          {t.equipment.confirmations(e.confirmations ?? 0)}
        </p>
        {mt && (
          <Link href={`/katalog/${mt.slug}`} className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold underline underline-offset-2">
            {t.equipment.seeInstructions}
          </Link>
        )}
      </header>

      <Card>
        <h2 className="text-lg font-bold">{t.equipment.detailWeights}</h2>
        {e.weight_step_kg ? (
          <>
            <p className="mt-1 text-base">
              {fmtKg(e.weight_step_kg)} kg-trin
              {e.extra_plate_kg ? ` + mellemplade ${fmtKg(e.extra_plate_kg)} kg` : ""}
            </p>
            <p className="mt-2 text-sm text-muted">
              {weights.slice(0, 12).map(fmtKg).join(" · ")}
              {weights.length > 12 ? " …" : ""} kg
            </p>
          </>
        ) : (
          <p className="mt-1 text-base text-muted">{t.equipment.noWeights}</p>
        )}
        {!removed && (
          <details className="mt-4">
            <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold underline underline-offset-2">
              {t.equipment.editWeights}
            </summary>
            <EditWeightsForm equipment={e} />
          </details>
        )}
      </Card>

      {!removed && (
        <Card className="space-y-4">
          {canConfirm ? (
            <form action={confirmEquipment}>
              <input type="hidden" name="id" value={e.id} />
              <Button type="submit">{t.equipment.confirm}</Button>
            </form>
          ) : (
            myVote?.vote === "confirm" && <p className="text-base text-muted">{t.equipment.confirmed}</p>
          )}
          <details>
            <summary className="min-h-11 cursor-pointer content-center text-sm font-semibold underline underline-offset-2">
              {t.equipment.report}
            </summary>
            <form action={reportEquipment} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={e.id} />
              <textarea
                name="note"
                maxLength={300}
                rows={3}
                placeholder={t.equipment.reportPlaceholder}
                className="block w-full rounded-2xl border border-border bg-surface p-4 text-base outline-none focus:border-accent-text"
              />
              <Button type="submit" variant="secondary">
                {t.equipment.sendReport}
              </Button>
            </form>
          </details>
        </Card>
      )}

      <form action={setEquipmentRemoved}>
        <input type="hidden" name="id" value={e.id} />
        <input type="hidden" name="removed" value={removed ? "0" : "1"} />
        <ConfirmSubmit
          variant="secondary"
          className={removed ? "" : "text-danger"}
          confirmText={removed ? undefined : t.equipment.removeConfirm}
        >
          {removed ? t.equipment.restore : t.equipment.remove}
        </ConfirmSubmit>
      </form>
    </main>
  );
}
