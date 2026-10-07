// One small client for the backend. Every call goes through `request`, so
// error handling and the base URL live in a single place.
import type {
  ActionItem,
  AskResponse,
  Comment,
  Insights,
  MeetingDetail,
  MeetingFilters,
  MeetingPage,
  Participant,
  SearchResults,
  Segment,
  Summary,
  SummaryStyle,
  Tag,
  Task,
  User,
} from "./types";

export const API_URL = "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

/** Pull a readable message out of a FastAPI error body. */
function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  if (status === 429) return "Too many requests. Please wait a moment.";
  return `Request failed (${status})`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    console.log("FETCHING URL:", `${API_URL}/api${path}`);
    response = await fetch(`${API_URL}/api${path}`, init);
  } catch (err) {
    console.error("FETCH ERROR:", err);
    throw new ApiError("Cannot reach the server. Is the backend running?", 0);
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new ApiError(errorMessage(body, response.status), response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function json(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

/** Build a query string, leaving out empty values. */
function toQuery(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

export interface MeetingInput {
  title: string;
  started_at?: string;
  participants: string[];
  tags: string[];
  transcript?: string;
}

export const api = {
  me: () => request<User>("/me", { cache: "no-store" }),
  participants: () => request<Participant[]>("/participants"),
  tags: () => request<Tag[]>("/tags"),

  listMeetings: (filters: MeetingFilters = {}) =>
    request<MeetingPage>(`/meetings${toQuery(filters)}`),
  getMeeting: (id: number) => request<MeetingDetail>(`/meetings/${id}`),
  createMeeting: (input: MeetingInput) => request<MeetingDetail>("/meetings", json("POST", input)),
  uploadMeeting: (form: FormData) =>
    request<MeetingDetail>("/meetings/upload", { method: "POST", body: form }),
  updateMeeting: (id: number, input: Partial<MeetingInput>) =>
    request<MeetingDetail>(`/meetings/${id}`, json("PATCH", input)),
  deleteMeeting: (id: number) => request<void>(`/meetings/${id}`, { method: "DELETE" }),

  getTranscript: (id: number) => request<Segment[]>(`/meetings/${id}/transcript`),

  getInsights: (id: number) => request<Insights>(`/meetings/${id}/insights`),

  regenerateSummary: (id: number, style: SummaryStyle = "standard") =>
    request<MeetingDetail>(`/meetings/${id}/summary/regenerate`, json("POST", { style })),
  updateSummary: (
    id: number,
    input: { overview?: string; key_points?: string[]; rating?: number },
  ) =>
    request<Summary>(`/meetings/${id}/summary`, json("PATCH", input)),

  listTasks: (done?: boolean) => request<Task[]>(`/action-items${toQuery({ done })}`),
  addActionItem: (meetingId: number, input: { text: string; assignee?: string | null }) =>
    request<ActionItem>(`/meetings/${meetingId}/action-items`, json("POST", input)),
  updateActionItem: (
    id: number,
    input: { text?: string; assignee?: string | null; is_done?: boolean },
  ) => request<ActionItem>(`/action-items/${id}`, json("PATCH", input)),
  deleteActionItem: (id: number) => request<void>(`/action-items/${id}`, { method: "DELETE" }),

  listComments: (meetingId: number) => request<Comment[]>(`/meetings/${meetingId}/comments`),
  addComment: (meetingId: number, segmentId: number, body: string) =>
    request<Comment>(
      `/meetings/${meetingId}/comments`,
      json("POST", { segment_id: segmentId, body }),
    ),
  deleteComment: (id: number) => request<void>(`/comments/${id}`, { method: "DELETE" }),

  search: (q: string) => request<SearchResults>(`/search${toQuery({ q })}`),
  ask: (meetingId: number, question: string) =>
    request<AskResponse>(`/meetings/${meetingId}/ask`, json("POST", { question })),

  exportUrl: (meetingId: number, content: "transcript" | "summary", format: "md" | "txt") =>
    `${API_URL}/api/meetings/${meetingId}/export${toQuery({ content, format })}`,
};
