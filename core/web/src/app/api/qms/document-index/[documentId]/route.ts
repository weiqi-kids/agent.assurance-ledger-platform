/**
 * API Route: /api/qms/document-index/[documentId]
 *
 * GET   — Get single document entry
 * PATCH — Update document entry
 */
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { authErrorResponse } from "@/lib/auth/guard";
import { getDb } from "@/lib/db";
import { documentIndex } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const rows = await db
      .select()
      .from(documentIndex)
      .where(eq(documentIndex.documentId, documentId));

    if (rows.length === 0) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    return Response.json({ document: rows[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { documentId } = await params;
    const body = (await request.json()) as {
      title?: string;
      documentType?: string;
      version?: string;
      status?: string;
      supersedesDocumentId?: string;
      distributionListReference?: string;
      notificationEvidencePath?: string;
      archivalLocation?: string;
      approvedBy?: string;
      approvedAt?: string;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getDb() as any;

    const existing = await db
      .select()
      .from(documentIndex)
      .where(eq(documentIndex.documentId, documentId));

    if (existing.length === 0) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (body.title !== undefined) updates.title = body.title;
    if (body.documentType !== undefined) {
      const validTypes = ["Policy", "SOP", "Work Instruction", "Form", "Template"];
      if (!validTypes.includes(body.documentType)) {
        return Response.json(
          { error: `documentType must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
      updates.documentType = body.documentType;
    }
    if (body.version !== undefined) updates.version = body.version;
    if (body.status !== undefined) {
      const validStatuses = ["draft", "approved", "superseded", "archived"];
      if (!validStatuses.includes(body.status)) {
        return Response.json(
          { error: `status must be one of: ${validStatuses.join(", ")}` },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }
    if (body.supersedesDocumentId !== undefined)
      updates.supersedesDocumentId = body.supersedesDocumentId;
    if (body.distributionListReference !== undefined)
      updates.distributionListReference = body.distributionListReference;
    if (body.notificationEvidencePath !== undefined)
      updates.notificationEvidencePath = body.notificationEvidencePath;
    if (body.archivalLocation !== undefined)
      updates.archivalLocation = body.archivalLocation;
    if (body.approvedBy !== undefined) updates.approvedBy = body.approvedBy;
    if (body.approvedAt !== undefined) updates.approvedAt = body.approvedAt;

    await db
      .update(documentIndex)
      .set(updates)
      .where(eq(documentIndex.documentId, documentId));

    const updated = await db
      .select()
      .from(documentIndex)
      .where(eq(documentIndex.documentId, documentId));

    return Response.json({ document: updated[0] });
  } catch (error) {
    return authErrorResponse(error);
  }
}
