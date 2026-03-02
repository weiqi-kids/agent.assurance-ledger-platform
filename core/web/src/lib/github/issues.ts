/**
 * GitHub Issues CRUD operations for the Assurance Ledger Platform.
 *
 * Used for:
 * - Findings sync (bidirectional with findings-log.json)
 * - Deviation reporting
 * - Change requests (schema governance)
 * - Client complaints
 * - Incident tracking
 */
import { getOctokit, getRepoInfo } from "./app-auth";

export interface CreateIssueParams {
  title: string;
  body: string;
  labels?: string[];
  milestone?: number;
  assignees?: string[];
}

export interface UpdateIssueParams {
  issueNumber: number;
  title?: string;
  body?: string;
  state?: "open" | "closed";
  labels?: string[];
  assignees?: string[];
}

export interface IssueComment {
  issueNumber: number;
  body: string;
}

/**
 * Create a GitHub Issue.
 */
export async function createIssue(params: CreateIssueParams) {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();

  const response = await octokit.issues.create({
    owner,
    repo,
    title: params.title,
    body: params.body,
    labels: params.labels,
    milestone: params.milestone,
    assignees: params.assignees,
  });

  return response.data;
}

/**
 * Update a GitHub Issue.
 */
export async function updateIssue(params: UpdateIssueParams) {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();

  const response = await octokit.issues.update({
    owner,
    repo,
    issue_number: params.issueNumber,
    title: params.title,
    body: params.body,
    state: params.state,
    labels: params.labels,
    assignees: params.assignees,
  });

  return response.data;
}

/**
 * Get a single GitHub Issue by number.
 */
export async function getIssue(issueNumber: number) {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();

  const response = await octokit.issues.get({
    owner,
    repo,
    issue_number: issueNumber,
  });

  return response.data;
}

/**
 * List GitHub Issues with optional filters.
 */
export async function listIssues(options?: {
  labels?: string;
  state?: "open" | "closed" | "all";
  perPage?: number;
  page?: number;
}) {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();

  const response = await octokit.issues.listForRepo({
    owner,
    repo,
    labels: options?.labels,
    state: options?.state ?? "open",
    per_page: options?.perPage ?? 30,
    page: options?.page ?? 1,
  });

  return response.data;
}

/**
 * Add a comment to a GitHub Issue.
 */
export async function addComment(params: IssueComment) {
  const octokit = getOctokit();
  const { owner, repo } = getRepoInfo();

  const response = await octokit.issues.createComment({
    owner,
    repo,
    issue_number: params.issueNumber,
    body: params.body,
  });

  return response.data;
}

/**
 * Create a finding Issue with the proper template format.
 */
export async function createFindingIssue(finding: {
  findingId: string;
  controlId: string;
  severity: string;
  description: string;
  detectionMethod: string;
}) {
  const body = [
    `### Finding ID\n${finding.findingId}`,
    `### Control ID\n${finding.controlId}`,
    `### Severity\n${finding.severity}`,
    `### Detection Method\n${finding.detectionMethod}`,
    `### Description\n${finding.description}`,
  ].join("\n\n");

  return createIssue({
    title: `[Finding] ${finding.findingId}: ${finding.controlId}`,
    body,
    labels: ["finding", "audit"],
  });
}

/**
 * Create an incident Issue for ledger conflicts or projection failures.
 */
export async function createIncidentIssue(incident: {
  type: "LEDGER_WRITE_CONFLICT" | "PROJECTION_UPDATE_FAILED" | "PROJECTOR_VERSION_MISMATCH";
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const metaBlock = incident.metadata
    ? `\n\n### Metadata\n\`\`\`json\n${JSON.stringify(incident.metadata, null, 2)}\n\`\`\``
    : "";

  return createIssue({
    title: `[Incident] ${incident.type}`,
    body: `### Description\n${incident.description}${metaBlock}`,
    labels: ["incident", "p1"],
  });
}
