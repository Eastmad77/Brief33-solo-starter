export type ActionItem = { id: string; task: string; owner?: string; due?: string; status?: "pending"|"done" };
export type MeetingSummary = {
  title: string;
  summary: string;
  agenda: string[];
  discussion: { topic: string; notes: string[] }[];
  decisions: string[];
  actions: ActionItem[];
};
export type Meeting = {
  id: string;
  createdAt: string;
  title: string;
  audioUrl?: string;
  transcript?: string;
  summary?: MeetingSummary;
};
