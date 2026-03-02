/**
 * JSON Schema validation library.
 *
 * - AJV-based validation against schemas in core/schemas/
 * - Schema version compatibility checking
 * - Framework-agnostic: no Next.js imports
 */
import Ajv from "ajv";
import addFormats from "ajv-formats";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/** Cache of loaded schemas keyed by $id */
const schemaCache = new Map<string, object>();

/**
 * Load a JSON Schema from the core/schemas/ directory.
 */
export function loadSchema(schemaId: string): object {
  if (schemaCache.has(schemaId)) {
    return schemaCache.get(schemaId)!;
  }

  // Resolve the schema file path from the $id
  const schemasDir = join(__dirname, "..", "schemas");
  const filename = schemaId.includes("/")
    ? schemaId.split("/").pop()!
    : schemaId;
  const filePath = join(schemasDir, filename);

  const content = readFileSync(filePath, "utf-8");
  const schema = JSON.parse(content);
  schemaCache.set(schemaId, schema);
  ajv.addSchema(schema, schemaId);
  return schema;
}

/**
 * Load all schemas from the core/schemas/ directory.
 */
export function loadAllSchemas(): void {
  const schemasDir = join(__dirname, "..", "schemas");
  const files = readdirSync(schemasDir).filter((f) =>
    f.endsWith(".schema.json")
  );
  for (const file of files) {
    const filePath = join(schemasDir, file);
    const content = readFileSync(filePath, "utf-8");
    const schema = JSON.parse(content);
    const id = schema.$id || file;
    schemaCache.set(id, schema);
    if (!ajv.getSchema(id)) {
      ajv.addSchema(schema, id);
    }
  }
}

/**
 * Validate data against a named schema.
 *
 * Returns { valid: true } or { valid: false, errors: string[] }
 */
export function validate(
  schemaId: string,
  data: unknown
): { valid: true } | { valid: false; errors: string[] } {
  let validateFn = ajv.getSchema(schemaId);
  if (!validateFn) {
    loadSchema(schemaId);
    validateFn = ajv.getSchema(schemaId);
  }

  if (!validateFn) {
    return { valid: false, errors: [`Schema "${schemaId}" not found`] };
  }

  const isValid = validateFn(data);
  if (isValid) {
    return { valid: true };
  }

  const errors = (validateFn.errors ?? []).map((e) => {
    const path = e.instancePath || "/";
    return `${path}: ${e.message}`;
  });

  return { valid: false, errors };
}

/**
 * Check schema version compatibility.
 *
 * A data version is compatible with a schema version if:
 * - Major versions match
 * - Data minor version <= schema minor version
 *
 * E.g., data v1.2.0 is compatible with schema v1.3.0 but not v2.0.0 or v1.1.0
 */
export function isVersionCompatible(
  dataVersion: string,
  schemaVersion: string
): boolean {
  const [dMajor, dMinor] = dataVersion.split(".").map(Number);
  const [sMajor, sMinor] = schemaVersion.split(".").map(Number);

  if (dMajor !== sMajor) return false;
  if (dMinor > sMinor) return false;
  return true;
}

/**
 * Validate data with schema version compatibility check.
 */
export function validateWithVersion(
  schemaId: string,
  data: unknown,
  currentSchemaVersion: string
): { valid: true } | { valid: false; errors: string[] } {
  const record = data as Record<string, unknown>;
  const dataVersion = record?.schema_version as string | undefined;

  if (!dataVersion) {
    return { valid: false, errors: ["Missing schema_version field"] };
  }

  if (!isVersionCompatible(dataVersion, currentSchemaVersion)) {
    return {
      valid: false,
      errors: [
        `Schema version incompatible: data v${dataVersion} vs schema v${currentSchemaVersion}`,
      ],
    };
  }

  return validate(schemaId, data);
}
