/**
 * Durable offline outbox for cloud sync on weak connectivity.
 * Queues fit events / scan pushes in localStorage and flushes when online.
 */

import { isApiConfigured } from "../api/config";
import { hasCloudSyncConsent } from "../consent";
import { pushFitEventViaApi, pushScanViaApi } from "../api/syncApi";
import type { FitEvent, ScanResult } from "../../types";

const QUEUE_KEY = "fitsense:syncOutbox";
const MAX_QUEUE = 100;

type OutboxItem =
  | { id: string; kind: "fit_event"; payload: FitEvent; enqueuedAt: number }
  | { id: string; kind: "scan"; payload: ScanResult; enqueuedAt: number };

function readQueue(): OutboxItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboxItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: OutboxItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUE)));
}

function newId(): string {
  return `q_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function enqueueFitEvent(event: FitEvent): void {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  const q = readQueue();
  q.push({
    id: newId(),
    kind: "fit_event",
    payload: event,
    enqueuedAt: Date.now(),
  });
  writeQueue(q);
}

export function enqueueScan(scan: ScanResult): void {
  if (!hasCloudSyncConsent() || !isApiConfigured()) return;
  const q = readQueue();
  q.push({
    id: newId(),
    kind: "scan",
    payload: scan,
    enqueuedAt: Date.now(),
  });
  writeQueue(q);
}

export function pendingSyncCount(): number {
  return readQueue().length;
}

let flushing = false;

export async function flushSyncOutbox(): Promise<{ sent: number; left: number }> {
  if (flushing) return { sent: 0, left: pendingSyncCount() };
  if (!hasCloudSyncConsent() || !isApiConfigured()) {
    return { sent: 0, left: pendingSyncCount() };
  }
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { sent: 0, left: pendingSyncCount() };
  }
  flushing = true;
  let sent = 0;
  try {
    const remaining: OutboxItem[] = [];
    for (const item of readQueue()) {
      try {
        if (item.kind === "fit_event") {
          await pushFitEventViaApi(item.payload);
        } else {
          await pushScanViaApi(item.payload);
        }
        sent += 1;
      } catch {
        remaining.push(item);
      }
    }
    writeQueue(remaining);
    return { sent, left: remaining.length };
  } finally {
    flushing = false;
  }
}

export function installSyncOutboxListeners(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("online", () => {
    void flushSyncOutbox();
  });
  // Periodic gentle flush for flaky links.
  window.setInterval(() => {
    void flushSyncOutbox();
  }, 60_000);
}
