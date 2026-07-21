import type { FitEvent, FitProfile, ScanResult } from "../../types";
import type { CloudPullResult } from "../cloud/sync";
import { apiFetch } from "./client";

export async function pullAllViaApi(): Promise<CloudPullResult> {
  const res = await apiFetch("/v1/sync");
  if (!res.ok) {
    throw new Error(`sync pull failed: HTTP ${res.status}`);
  }
  const body = (await res.json()) as CloudPullResult;
  return {
    fitProfile: body.fitProfile ?? null,
    fitEvents: body.fitEvents ?? [],
    scans: body.scans ?? [],
  };
}

export async function pushFitProfileViaApi(profile: FitProfile): Promise<void> {
  const res = await apiFetch("/v1/sync/fit-profile", {
    method: "PUT",
    body: JSON.stringify({ ...profile, _syncedAtEpochMs: Date.now() }),
  });
  if (!res.ok) {
    throw new Error(`sync fit-profile failed: HTTP ${res.status}`);
  }
}

export async function pushFitEventViaApi(event: FitEvent): Promise<void> {
  const res = await apiFetch(
    `/v1/sync/fit-events/${encodeURIComponent(event.eventId)}`,
    {
      method: "PUT",
      body: JSON.stringify(event),
    },
  );
  if (!res.ok) {
    throw new Error(`sync event failed: HTTP ${res.status}`);
  }
}

export async function pushScanViaApi(scan: ScanResult): Promise<void> {
  const res = await apiFetch(`/v1/sync/scans/${encodeURIComponent(scan.scanId)}`, {
    method: "PUT",
    body: JSON.stringify(scan),
  });
  if (!res.ok) {
    throw new Error(`sync scan failed: HTTP ${res.status}`);
  }
}

export async function deleteScanViaApi(scanId: string): Promise<void> {
  const res = await apiFetch(`/v1/sync/scans/${encodeURIComponent(scanId)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`sync scan delete failed: HTTP ${res.status}`);
  }
}

export async function eraseCloudDataViaApi(): Promise<void> {
  const res = await apiFetch("/v1/sync", { method: "DELETE" });
  if (!res.ok) {
    throw new Error(`sync erase failed: HTTP ${res.status}`);
  }
}
