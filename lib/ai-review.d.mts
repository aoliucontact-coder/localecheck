import type {Issue,Row} from './review.mjs';

export const PROMPT_VERSION:string;
export type GlossaryEntry={source:string;target:string};
export type ReviewRequest={rows:Row[];context:string;glossary:GlossaryEntry[]};
export function validateReviewRequest(data:unknown):ReviewRequest;
export function buildReviewMessages(data:ReviewRequest):{role:'system'|'user';content:string}[];
export function parseReviewResponse(content:string,validIds:Set<string>,metadata:{model:string}):Issue[];
