import { AITurnResponse } from '../types/game';

/**
 * Doc 04: hard backstop on top of the prompt's length instructions — the model
 * (or offline generator) doesn't always honor a requested character count.
 * situation/outcome are read through the page-by-page UI (see paginate()
 * below) instead of being truncated, so nothing the AI wrote is ever lost.
 * choice/day_summary still live in single-line UI (a button, a one-line
 * return-summary banner) and stay hard-capped.
 */
const LIMITS = {
  choice: 25,
  daySummary: 30,
  threadSummary: 40,
};

/** Cuts at the last word boundary before `max` so we never split mid-word; always marks truncation with "…". */
function clamp(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastSpace = truncated.lastIndexOf(' ');
  const cut = lastSpace >= max * 0.5 ? truncated.slice(0, lastSpace) : truncated;
  return `${cut.trimEnd()}…`;
}

export function clampTurnResponse(response: AITurnResponse): AITurnResponse {
  return {
    ...response,
    choices: response.choices.map((choice) => clamp(choice, LIMITS.choice)),
    day_summary: clamp(response.day_summary, LIMITS.daySummary),
    thread: response.thread?.summary
      ? { ...response.thread, summary: clamp(response.thread.summary, LIMITS.threadSummary) }
      : response.thread,
  };
}

/**
 * Splits text into sentence-safe reading pages (never cuts mid-sentence, let
 * alone mid-word) for the book-style "다음" reading UI. Groups whole sentences
 * up to ~maxCharsPerPage; a single sentence longer than that just becomes its
 * own (longer) page rather than being cut.
 */
export function paginate(text: string | undefined, maxCharsPerPage = 110): string[] {
  if (!text) return [];
  const sentences = (text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text]).map((s) => s.trim()).filter(Boolean);
  const pages: string[] = [];
  let current = '';
  for (const sentence of sentences) {
    const candidate = current ? `${current} ${sentence}` : sentence;
    if (current && candidate.length > maxCharsPerPage) {
      pages.push(current);
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current) pages.push(current);
  return pages;
}
