import { AITurnResponse } from '../types/game';

/**
 * Doc 04: hard backstop on top of the prompt's length instructions — the model
 * (or offline generator) doesn't always honor a requested character count, so
 * this guarantees the UI never shows a wall of text regardless of source.
 */
const LIMITS = {
  situation: 150,
  outcome: 150,
  choice: 25,
  daySummary: 30,
};

function clamp(text: string, max: number): string {
  if (!text || text.length <= max) return text;
  const truncated = text.slice(0, max);
  const lastPunct = Math.max(
    truncated.lastIndexOf('.'),
    truncated.lastIndexOf('!'),
    truncated.lastIndexOf('?'),
    truncated.lastIndexOf('다'),
    truncated.lastIndexOf('요')
  );
  if (lastPunct >= max * 0.5) {
    return truncated.slice(0, lastPunct + 1);
  }
  return `${truncated.trimEnd()}…`;
}

export function clampTurnResponse(response: AITurnResponse): AITurnResponse {
  return {
    ...response,
    situation: clamp(response.situation, LIMITS.situation),
    outcome: response.outcome ? clamp(response.outcome, LIMITS.outcome) : response.outcome,
    choices: response.choices.map((choice) => clamp(choice, LIMITS.choice)),
    day_summary: clamp(response.day_summary, LIMITS.daySummary),
  };
}
