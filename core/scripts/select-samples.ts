/**
 * CLI Script: Select Samples
 *
 * Generates a random sample selection for audit testing.
 * Uses a seeded PRNG for reproducibility.
 *
 * Usage: npx tsx core/scripts/select-samples.ts --period 2025-Q1 --seed 42 [--domain AC]
 * Run from: core/web/ directory (needs DB access)
 * Exit: 0 on success, 1 on failure
 */
import * as fs from "fs";
import * as path from "path";

interface SampleSelection {
  period: string;
  seed: number;
  domain?: string;
  selected: SampleItem[];
  generated_at: string;
}

interface SampleItem {
  control_id: string;
  domain: string;
  risk_tier: string;
  sample_size: number;
  population_size: number;
  selected_indices: number[];
}

/** Sampling sizes based on risk tier (per AICPA / ISQM1 guidance) */
const SAMPLE_SIZE_TABLE: Record<string, number> = {
  High: 25,
  Medium: 15,
  Low: 5,
};

/**
 * Simple seeded pseudo-random number generator (Mulberry32).
 * Deterministic given the same seed.
 */
function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fisher-Yates shuffle with seeded RNG, then take first n.
 */
function selectSample(
  populationSize: number,
  sampleSize: number,
  rng: () => number
): number[] {
  const size = Math.min(sampleSize, populationSize);
  const indices = Array.from({ length: populationSize }, (_, i) => i);

  // Fisher-Yates shuffle (partial, only need first `size` elements)
  for (let i = 0; i < size; i++) {
    const j = i + Math.floor(rng() * (populationSize - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  return indices.slice(0, size).sort((a, b) => a - b);
}

function parseArgs(
  args: string[]
): { period: string; seed: number; domain?: string } {
  let period = "";
  let seed = 0;
  let domain: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--period" && i + 1 < args.length) {
      period = args[i + 1];
      i++;
    } else if (args[i] === "--seed" && i + 1 < args.length) {
      seed = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--domain" && i + 1 < args.length) {
      domain = args[i + 1];
      i++;
    }
  }

  if (!period) {
    console.error("ERROR: --period is required (e.g. --period 2025-Q1)");
    process.exit(1);
  }
  if (isNaN(seed) || seed === 0) {
    console.error("ERROR: --seed is required and must be a non-zero integer");
    process.exit(1);
  }

  return { period, seed, domain };
}

function main(): void {
  const { period, seed, domain } = parseArgs(process.argv.slice(2));

  // Resolve paths
  const projectRoot = path.resolve(__dirname, "..", "..");
  const outputDir = path.join(
    projectRoot,
    "ledger",
    "audit",
    "sample-selection"
  );

  console.log("Sample Selection");
  console.log(`Period: ${period}`);
  console.log(`Seed: ${seed}`);
  if (domain) {
    console.log(`Domain filter: ${domain}`);
  }
  console.log("---");

  // Define the 30 controls across 6 domains
  // In a full implementation, these would come from the DB
  const controlDomains = [
    { prefix: "AC", count: 5, name: "Access Control" },
    { prefix: "CM", count: 5, name: "Change Management" },
    { prefix: "PI", count: 5, name: "Processing Integrity" },
    { prefix: "CF", count: 5, name: "Client Facing" },
    { prefix: "IR", count: 5, name: "Incident Response" },
    { prefix: "MN", count: 5, name: "Monitoring" },
  ];

  const rng = createSeededRng(seed);
  const selected: SampleItem[] = [];

  for (const cd of controlDomains) {
    if (domain && cd.prefix !== domain) continue;

    for (let i = 1; i <= cd.count; i++) {
      const controlId = `${cd.prefix}-${String(i).padStart(3, "0")}`;

      // Assign risk tiers deterministically based on control position
      const riskTiers = ["High", "Medium", "Low"];
      const riskTier = riskTiers[i % 3];
      const sampleSize = SAMPLE_SIZE_TABLE[riskTier];

      // Simulated population size (in real use, this comes from DB)
      const populationSize = 50 + Math.floor(rng() * 200);

      const selectedIndices = selectSample(populationSize, sampleSize, rng);

      selected.push({
        control_id: controlId,
        domain: cd.prefix,
        risk_tier: riskTier,
        sample_size: selectedIndices.length,
        population_size: populationSize,
        selected_indices: selectedIndices,
      });
    }
  }

  // Generate CSV output
  const csvHeader = [
    "seed",
    "period",
    "generated_at",
    "control_id",
    "domain",
    "risk_tier",
    "population_size",
    "sample_size",
    "selected_indices",
  ].join(",");

  const generatedAt = new Date().toISOString();
  const csvRows = selected.map((item) =>
    [
      seed,
      period,
      generatedAt,
      item.control_id,
      item.domain,
      item.risk_tier,
      item.population_size,
      item.sample_size,
      `"${item.selected_indices.join(";")}"`,
    ].join(",")
  );

  const csvContent = [csvHeader, ...csvRows].join("\n");

  // Write output
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, `sample-${period}-seed${seed}.csv`);
  fs.writeFileSync(outputPath, csvContent, "utf-8");

  // Also write JSON for programmatic use
  const selection: SampleSelection = {
    period,
    seed,
    domain,
    selected,
    generated_at: generatedAt,
  };

  const jsonPath = path.join(outputDir, `sample-${period}-seed${seed}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(selection, null, 2), "utf-8");

  console.log(`Controls sampled: ${selected.length}`);
  console.log(
    `Total sample items: ${selected.reduce((acc, s) => acc + s.sample_size, 0)}`
  );
  console.log("");
  console.log(`CSV output: ${outputPath}`);
  console.log(`JSON output: ${jsonPath}`);
  console.log("");
  console.log("Summary by risk tier:");
  for (const tier of ["High", "Medium", "Low"]) {
    const tierItems = selected.filter((s) => s.risk_tier === tier);
    console.log(
      `  ${tier}: ${tierItems.length} controls, ${tierItems.reduce((acc, s) => acc + s.sample_size, 0)} samples`
    );
  }

  process.exit(0);
}

main();
