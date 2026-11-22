import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { aiModel } from "./config";

export type CatalogEntry = { slug: string; name: string; category: string };
export type ImageInput = { base64: string; mediaType: "image/jpeg" | "image/png" | "image/webp" };

export type EquipmentRecognition = {
  is_equipment: boolean;
  contains_people: boolean;
  machine_type_slug: string | null; // null = ukendt
  confidence: number; // 0..1
  alternatives: string[];
  reasoning_short: string;
};

export type WeightStackReading = {
  is_weight_stack: boolean;
  contains_people: boolean;
  plate_count: number | null;
  step_kg: number | null;
  min_kg: number | null;
  max_kg: number | null;
  extra_plate_kg: number | null;
  confidence: number;
  reasoning_short: string;
};

export class AiRefusedError extends Error {}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0);

let client: Anthropic | null = null;
function getClient() {
  client ??= new Anthropic(); // læser ANTHROPIC_API_KEY fra miljøet
  return client;
}

function imageBlock(img: ImageInput): Anthropic.ImageBlockParam {
  return { type: "image", source: { type: "base64", media_type: img.mediaType, data: img.base64 } };
}

function logUsage(kind: string, usage: Anthropic.Usage) {
  console.info(`[ai] ${kind} model=${aiModel()} input=${usage.input_tokens} output=${usage.output_tokens}`);
}

// ---------------------------------------------------------------------------
// Genkendelse af maskintype
// ---------------------------------------------------------------------------

export async function recognizeEquipment(img: ImageInput, catalog: CatalogEntry[]): Promise<EquipmentRecognition> {
  const slugs = catalog.map((c) => c.slug) as [string, ...string[]];
  const schema = z.object({
    is_equipment: z.boolean(),
    contains_people: z.boolean(),
    machine_type_slug: z.enum([...slugs, "unknown"]),
    confidence: z.number(),
    alternatives: z.array(z.enum(slugs)),
    reasoning_short: z.string(),
  });

  const catalogText = catalog.map((c) => `- ${c.slug}: ${c.name} (${c.category})`).join("\n");

  const response = await getClient().messages.parse({
    model: aiModel(),
    max_tokens: 4000,
    output_config: { format: zodOutputFormat(schema), effort: "low" },
    system:
      "You identify fitness equipment in photos taken inside gyms. Classify by training FUNCTION, not brand or model: " +
      "all chest press machines are 'chest_press', regardless of manufacturer.\n\n" +
      "Choose machine_type_slug from this catalog only, or 'unknown' if none fits:\n" +
      catalogText +
      "\n\nRules:\n" +
      "- is_equipment: false if the photo does not mainly show gym equipment.\n" +
      "- contains_people: true if any person or recognisable body part (face, body) is visible.\n" +
      "- confidence: 0 to 1. Use below 0.6 when the angle, lighting or machine type is ambiguous.\n" +
      "- alternatives: up to 3 other plausible slugs, most likely first. Empty if none.\n" +
      "- reasoning_short: one short sentence in Danish explaining the choice.",
    messages: [
      {
        role: "user",
        content: [imageBlock(img), { type: "text", text: "Which equipment type is this?" }],
      },
    ],
  });

  logUsage("equipment", response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusedError("refusal");
  const out = response.parsed_output;
  if (!out) throw new Error(`AI-svar kunne ikke læses (stop_reason=${response.stop_reason})`);

  return {
    is_equipment: out.is_equipment,
    contains_people: out.contains_people,
    machine_type_slug: out.machine_type_slug === "unknown" ? null : out.machine_type_slug,
    confidence: clamp01(out.confidence),
    alternatives: [...new Set(out.alternatives)].filter((s) => s !== out.machine_type_slug).slice(0, 3),
    reasoning_short: out.reasoning_short.slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// Aflæsning af vægtstak
// ---------------------------------------------------------------------------

const stackSchema = z.object({
  is_weight_stack: z.boolean(),
  contains_people: z.boolean(),
  plate_count: z.number().nullable(),
  step_kg: z.number().nullable(),
  min_kg: z.number().nullable(),
  max_kg: z.number().nullable(),
  extra_plate_kg: z.number().nullable(),
  confidence: z.number(),
  reasoning_short: z.string(),
});

const positiveOrNull = (n: number | null, max: number) =>
  n != null && Number.isFinite(n) && n > 0 && n <= max ? Math.round(n * 100) / 100 : null;

export async function readWeightStack(img: ImageInput): Promise<WeightStackReading> {
  const response = await getClient().messages.parse({
    model: aiModel(),
    max_tokens: 4000,
    output_config: { format: zodOutputFormat(stackSchema), effort: "low" },
    system:
      "You read the weight stack (selectorized plate stack) of a gym machine from a photo.\n" +
      "Count the plates and read the printed numbers. Report weights in kilograms; if the labels are in lbs, convert to kg.\n" +
      "- step_kg: the weight added by each plate (e.g. 7, 5, 4.5, 3.5).\n" +
      "- min_kg: the lightest selectable weight (usually the top plate). max_kg: the heaviest.\n" +
      "- extra_plate_kg: weight of a small add-on/half plate on top of the stack, if visible; otherwise null.\n" +
      "- Use null for any value you cannot read. Never guess numbers you cannot see.\n" +
      "- is_weight_stack: false if the photo does not show a weight stack. contains_people: true if a person is visible.\n" +
      "- confidence: 0 to 1. reasoning_short: one short sentence in Danish.",
    messages: [
      {
        role: "user",
        content: [imageBlock(img), { type: "text", text: "Read this weight stack." }],
      },
    ],
  });

  logUsage("weight-stack", response.usage);
  if (response.stop_reason === "refusal") throw new AiRefusedError("refusal");
  const out = response.parsed_output;
  if (!out) throw new Error(`AI-svar kunne ikke læses (stop_reason=${response.stop_reason})`);

  return {
    is_weight_stack: out.is_weight_stack,
    contains_people: out.contains_people,
    plate_count: positiveOrNull(out.plate_count, 100),
    step_kg: positiveOrNull(out.step_kg, 50),
    min_kg: positiveOrNull(out.min_kg, 500),
    max_kg: positiveOrNull(out.max_kg, 1000),
    extra_plate_kg: positiveOrNull(out.extra_plate_kg, 50),
    confidence: clamp01(out.confidence),
    reasoning_short: out.reasoning_short.slice(0, 300),
  };
}

// ---------------------------------------------------------------------------
// Test-tilstand (AI_MODE=mock): opdigtede, men realistiske svar. Koster intet.
// ---------------------------------------------------------------------------

export function mockRecognizeEquipment(catalog: CatalogEntry[]): EquipmentRecognition {
  const has = (s: string) => catalog.some((c) => c.slug === s);
  return {
    is_equipment: true,
    contains_people: false,
    machine_type_slug: has("chest_press") ? "chest_press" : (catalog[0]?.slug ?? null),
    confidence: 0.85,
    alternatives: ["pec_deck", "shoulder_press"].filter(has),
    reasoning_short: "Testsvar: siddende maskine med håndtag i brysthøjde, der presses fremad.",
  };
}

export function mockReadWeightStack(): WeightStackReading {
  return {
    is_weight_stack: true,
    contains_people: false,
    plate_count: 15,
    step_kg: 7,
    min_kg: 7,
    max_kg: 105,
    extra_plate_kg: 3.5,
    confidence: 0.8,
    reasoning_short: "Testsvar: 15 plader à 7 kg med en mellemplade på 3,5 kg.",
  };
}
