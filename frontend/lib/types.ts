// Shapes returned by the backend API. Kept in step with backend/app/schemas.py.

export interface Participant {
  id: number;
  name: string;
  email: string | null;
}

export interface Tag {
  id: number;
  name: string;
}

export interface Segment {
  id: number;
  position: number;
  speaker_name: string;
  start_ms: number;
  end_ms: number;
  text: string;
}

export interface Summary {
  overview: string;
  key_points: string[];
  keywords: string[];
  generated_by: string;
  style: SummaryStyle;
  rating: number | null;
  updated_at: string;
}

export type SummaryStyle = "condensed" | "standard" | "expanded";

export interface Chapter {
  id: number;
  title: string;
  summary: string;
  start_ms: number;
}

export interface ActionItem {
  id: number;
  meeting_id: number;
  text: string;
  assignee: string | null;
  is_done: boolean;
  source_start_ms: number | null;
  created_at: string;
}

export interface Task extends ActionItem {
  meeting_title: string;
}

export interface InsightFilter {
  key: string;
  label: string;
  count: number;
  segment_ids: number[];
}

export interface SpeakerStat {
  name: string;
  talk_ms: number;
  percent: number;
  word_count: number;
}

export interface Insights {
  filters: InsightFilter[];
  speakers: SpeakerStat[];
}

export interface MeetingListItem {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  source: string;
  participants: Participant[];
  tags: Tag[];
  action_items_total: number;
  action_items_done: number;
  overview: string;
}

export interface MeetingPage {
  items: MeetingListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface MeetingDetail {
  id: number;
  title: string;
  started_at: string;
  duration_seconds: number;
  source: string;
  media_url: string | null;
  participants: Participant[];
  tags: Tag[];
  summary: Summary | null;
  chapters: Chapter[];
  action_items: ActionItem[];
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Comment {
  id: number;
  segment_id: number;
  body: string;
  created_at: string;
  author: User;
}

export interface SearchHit {
  meeting_id: number;
  meeting_title: string;
  started_at: string;
  segment_id: number;
  speaker_name: string;
  start_ms: number;
  snippet: string;
}

export interface SearchResults {
  query: string;
  meetings: MeetingListItem[];
  transcript_hits: SearchHit[];
}

export interface AskResponse {
  answer: string;
  sources: Segment[];
}

export type SortOption = "recent" | "oldest" | "title" | "duration";

export interface MeetingFilters {
  q?: string;
  participant?: string;
  tag?: string;
  source?: string;
  date_from?: string;
  date_to?: string;
  sort?: SortOption;
  page?: number;
  page_size?: number;
}
