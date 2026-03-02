/**
 * API Route: /api/qms/document-index
 *
 * GET  — List documents with optional filters (docType, status)
 * POST — Create a new document entry
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { documentIndex } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const docTypeFilter = searchParams.get("docType");
    const statusFilter = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const conditions = [];
    if (docTypeFilter) {
      conditions.push(eq(documentIndex.documentType, docTypeFilter));
    }
    if (statusFilter) {
      conditions.push(eq(documentIndex.status, statusFilter));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(documentIndex)
      .where(where)
      .orderBy(documentIndex.documentId);

    return Response.json({ documents: rows });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as {
      documentId?: string;
      title?: string;
      documentType?: string;
      version?: string;
      supersedesDocumentId?: string;
      distributionListReference?: string;
    };

    if (!body.title || !body.documentType || !body.version) {
      return Response.json(
        { error: "title, documentType, and version are required" },
        { status: 400 }
      );
    }

    const validTypes = ["Policy", "SOP", "Work Instruction", "Form", "Template"];
    if (!validTypes.includes(body.documentType)) {
      return Response.json(
        { error: `documentType must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const id = nanoid();
    const documentId = body.documentId || `DOC-${nanoid(6).toUpperCase()}`;
    const now = new Date().toISOString();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    await db.insert(documentIndex).values({
      id,
      documentId,
      title: body.title,
      documentType: body.documentType,
      version: body.version,
      status: "draft",
      supersedesDocumentId: body.supersedesDocumentId ?? null,
      distributionListReference: body.distributionListReference ?? null,
      notificationEvidencePath: null,
      archivalLocation: null,
      approvedBy: null,
      approvedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    const inserted = await db
      .select()
      .from(documentIndex)
      .where(eq(documentIndex.id, id));

    return Response.json({ document: inserted[0] }, { status: 201 });
  } catch (error) {
    return authErrorResponse(error);
  }
}
