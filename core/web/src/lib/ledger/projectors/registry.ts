/**
 * Projector registry — maps event schema versions to projector implementations.
 *
 * When the event schema evolves, new projectors are registered here.
 * The writer uses the event's schema version to select the correct projector.
 */
import type { LedgerEvent } from "../types";
import { projectEvent as projectEventV1 } from "./v1";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ProjectorFn = (db: any, event: LedgerEvent) => Promise<void>;

const projectors: Record<string, ProjectorFn> = {
  "1": projectEventV1,
  "1.0.0": projectEventV1,
};

/**
 * Get the projector function for a given event schema version.
 * Falls back to v1 if version is not found.
 */
export function getProjector(version: string): ProjectorFn {
  const projector = projectors[version];
  if (!projector) {
    // Fall back to latest known projector with a warning
    console.warn(
      `[projector-registry] Unknown schema version "${version}", falling back to v1`
    );
    return projectEventV1;
  }
  return projector;
}

/**
 * Register a new projector for a schema version.
 */
export function registerProjector(
  version: string,
  projector: ProjectorFn
): void {
  projectors[version] = projector;
}
