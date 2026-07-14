import type { HandoffPayload } from "../types.js";

interface SessionEntry {
  payload: HandoffPayload;
  createdAt: number;
}

export class HandoffStore {
  private readonly sessions = new Map<string, SessionEntry>();

  constructor(private readonly ttlMs: number) {}

  prune(): void {
    const now = Date.now();
    for (const [id, entry] of this.sessions) {
      if (now - entry.createdAt > this.ttlMs) {
        this.sessions.delete(id);
      }
    }
  }

  set(sessionId: string, payload: HandoffPayload): void {
    this.prune();
    this.sessions.set(sessionId, { payload, createdAt: Date.now() });
  }

  get(sessionId: string): HandoffPayload | null {
    this.prune();
    const entry = this.sessions.get(sessionId);
    if (!entry || Date.now() - entry.createdAt > this.ttlMs) {
      this.sessions.delete(sessionId);
      return null;
    }
    return entry.payload;
  }

  delete(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}
