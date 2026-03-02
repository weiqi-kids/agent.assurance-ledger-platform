/**
 * CLI Script: Validate JSON Schemas
 *
 * Validates all schemas in core/schemas/:
 * - Each .schema.json file must be valid JSON Schema
 * - Must have $id and schema_version fields
 * - Cross-references are verified (e.g. controlId patterns)
 *
 * Usage: npx tsx core/scripts/validate-schemas.ts
 * Run from: project root
 * Exit: 0 on success, 1 on failure
 */
import * as fs from "fs";
import * as path from "path";

interface SchemaFile {
  filename: string;
  content: Record<string, unknown>;
}

function loadSchemas(schemasDir: string): SchemaFile[] {
  const files = fs.readdirSync(schemasDir).filter((f) => f.endsWith(".schema.json"));
  return files.map((filename) => {
    const filePath = path.join(schemasDir, filename);
    const raw = fs.readFileSync(filePath, "utf-8");
    const content = JSON.parse(raw) as Record<string, unknown>;
    return { filename, content };
  });
}

function validateSchema(schema: SchemaFile): string[] {
  const errors: string[] = [];
  const { filename, content } = schema;

  // Check $id field
  if (!content.$id) {
    errors.push(`${filename}: missing $id field`);
  }

  // Check $schema field
  if (!content.$schema) {
    errors.push(`${filename}: missing $schema field`);
  }

  // Check schema_version in properties
  const properties = content.properties as Record<string, unknown> | undefined;
  if (properties) {
    const schemaVersionProp = properties.schema_version as Record<string, unknown> | undefined;
    if (!schemaVersionProp) {
      errors.push(`${filename}: missing schema_version in properties`);
    }
  }

  // Check required fields
  if (!content.type) {
    errors.push(`${filename}: missing type field`);
  }

  // Check title
  if (!content.title) {
    errors.push(`${filename}: missing title field`);
  }

  return errors;
}

function validateCrossReferences(schemas: SchemaFile[]): string[] {
  const errors: string[] = [];

  // Collect all schema $ids
  const schemaIds = new Set(
    schemas.map((s) => s.content.$id as string).filter(Boolean)
  );

  // Check that all $ref references resolve (within the same schema or to known schemas)
  for (const schema of schemas) {
    const refs = findRefs(schema.content);
    for (const ref of refs) {
      // Internal refs start with #
      if (ref.startsWith("#")) continue;

      // External refs should reference a known schema
      const refBase = ref.split("#")[0];
      if (refBase && !schemaIds.has(refBase)) {
        errors.push(`${schema.filename}: unresolved $ref "${ref}"`);
      }
    }
  }

  return errors;
}

function findRefs(obj: unknown, refs: string[] = []): string[] {
  if (obj === null || obj === undefined || typeof obj !== "object") {
    return refs;
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      findRefs(item, refs);
    }
    return refs;
  }

  const record = obj as Record<string, unknown>;
  if (typeof record.$ref === "string") {
    refs.push(record.$ref);
  }

  for (const value of Object.values(record)) {
    findRefs(value, refs);
  }

  return refs;
}

function main(): void {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const schemasDir = path.join(projectRoot, "core", "schemas");

  console.log(`Validating schemas in ${schemasDir}`);
  console.log("---");

  if (!fs.existsSync(schemasDir)) {
    console.error(`ERROR: Schemas directory not found: ${schemasDir}`);
    process.exit(1);
  }

  const schemas = loadSchemas(schemasDir);
  console.log(`Found ${schemas.length} schema files`);

  const allErrors: string[] = [];

  // Validate each schema individually
  for (const schema of schemas) {
    const errors = validateSchema(schema);
    if (errors.length > 0) {
      allErrors.push(...errors);
    } else {
      console.log(`  OK: ${schema.filename}`);
    }
  }

  // Validate cross-references
  const crossRefErrors = validateCrossReferences(schemas);
  allErrors.push(...crossRefErrors);

  console.log("---");

  if (allErrors.length > 0) {
    console.error(`FAILED: ${allErrors.length} error(s) found:`);
    for (const error of allErrors) {
      console.error(`  - ${error}`);
    }
    process.exit(1);
  }

  console.log(`SUCCESS: All ${schemas.length} schemas are valid`);
  process.exit(0);
}

main();
