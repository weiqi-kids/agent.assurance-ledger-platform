/**
 * Sampling Engine for audit testing.
 *
 * Features:
 * - Fixed-seed PRNG (Mulberry32) — deterministic, reproducible sampling
 * - Risk-tier-based sample size calculation
 * - CSV output with metadata headers
 *
 * Same seed + same population → same result, always.
 */

export const SAMPLING_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Seeded PRNG — Mulberry32 (32-bit state, 32-bit output)
// Simple, fast, and deterministic for a given seed.
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Risk tier → minimum sample size
// ---------------------------------------------------------------------------

export type RiskTier = "High" | "Medium" | "Low";

const RISK_TIER_MINIMUMS: Record<RiskTier, number> = {
  High: 25,
  Medium: 15,
  Low: 5,
};

/**
 * Calculate the required sample size for a given risk tier and population size.
 * Returns min(population_size, tier_minimum).
 */
export function calculateSampleSize(
  riskTier: RiskTier,
  populationSize: number
): number {
  const minimum = RISK_TIER_MINIMUMS[riskTier];
  return Math.min(populationSize, minimum);
}

// ---------------------------------------------------------------------------
// Sample generation
// ---------------------------------------------------------------------------

export interface SampleParams<T> {
  population: T[];
  sampleSize: number;
  seed: number;
}

export interface SampleResult<T> {
  items: T[];
  indices: number[];
  seed: number;
  populationSize: number;
  sampleSize: number;
}

/**
 * Generate a deterministic sample from a population using Fisher-Yates shuffle
 * with a seeded PRNG. Same seed + same population → same result.
 */
export function generateSample<T>(params: SampleParams<T>): SampleResult<T> {
  const { population, sampleSize, seed } = params;

  if (sampleSize <= 0) {
    return {
      items: [],
      indices: [],
      seed,
      populationSize: population.length,
      sampleSize: 0,
    };
  }

  const effectiveSize = Math.min(sampleSize, population.length);
  const rng = mulberry32(seed);

  // Create index array and use Fisher-Yates partial shuffle
  const indices = population.map((_, i) => i);
  for (let i = 0; i < effectiveSize; i++) {
    const j = i + Math.floor(rng() * (indices.length - i));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }

  const selectedIndices = indices.slice(0, effectiveSize).sort((a, b) => a - b);
  const items = selectedIndices.map((idx) => population[idx]);

  return {
    items,
    indices: selectedIndices,
    seed,
    populationSize: population.length,
    sampleSize: effectiveSize,
  };
}

// ---------------------------------------------------------------------------
// CSV output
// ---------------------------------------------------------------------------

export interface CsvMetadata {
  seed: number;
  populationSize: number;
  sampleSize: number;
  sampledAt: string;
  operator: string;
  programVersion: string;
}

/**
 * Generate CSV header metadata lines (comment-prefixed).
 */
export function generateCsvHeader(metadata: CsvMetadata): string {
  const lines = [
    `# seed: ${metadata.seed}`,
    `# population_size: ${metadata.populationSize}`,
    `# sample_size: ${metadata.sampleSize}`,
    `# sampled_at: ${metadata.sampledAt}`,
    `# operator: ${metadata.operator}`,
    `# program_version: ${metadata.programVersion}`,
    `# sampling_engine_version: ${SAMPLING_ENGINE_VERSION}`,
  ];
  return lines.join("\n");
}

/**
 * Generate a complete CSV string for a sample result, including headers
 * and a simple index,item_reference format.
 */
export function generateSampleCsv(
  result: SampleResult<string>,
  metadata: CsvMetadata
): string {
  const header = generateCsvHeader(metadata);
  const dataHeader = "index,item_reference";
  const rows = result.items.map((item, i) => `${i + 1},${item}`);
  return [header, dataHeader, ...rows].join("\n");
}
