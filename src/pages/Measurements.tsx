import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { PageLayout } from "../components/PageLayout";
import { TopBar } from "../components/TopBar";
import { MeasurementCard } from "../components/MeasurementCard";
import { deleteScan, getOrCreateProfile, listScans } from "../lib/storage";
import type { MeasurementUnit, ScanResult } from "../types";

export function Measurements() {
  const nav = useNavigate();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [units, setUnits] = useState<MeasurementUnit>("mm");

  useEffect(() => {
    setScans(listScans());
    setUnits(getOrCreateProfile().preferences.units);
  }, []);

  const onDelete = (id: string) => {
    deleteScan(id);
    setScans(listScans());
  };

  return (
    <PageLayout withTopBar gap="gap-4">
      <TopBar title="Saved measurements" />

      {scans.length === 0 ? (
        <p className="text-sm text-ink-muted py-8 text-center">
          No saved scans yet.
        </p>
      ) : (
        <div className="space-y-3">
          {scans.map((scan, i) => (
            <div key={scan.scanId} className="flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <MeasurementCard
                  scan={scan}
                  index={i}
                  units={units}
                  onClick={() => nav(`/results/${scan.scanId}`)}
                />
              </div>
              <button
                onClick={() => onDelete(scan.scanId)}
                aria-label="Delete scan"
                className="w-11 h-11 rounded-full bg-surface-2 grid place-items-center hover:bg-surface-3 shrink-0"
              >
                <Trash2 className="w-4 h-4 text-ink-muted" />
              </button>
            </div>
          ))}
        </div>
      )}
    </PageLayout>
  );
}
