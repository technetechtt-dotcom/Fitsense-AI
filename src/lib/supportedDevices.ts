/**
 * Limited launch device allowlist — mirrors docs/supported-devices.json.
 * Uncertified devices may still measure; UI should warn, never invent mm.
 */
import supported from "../../docs/supported-devices.json";

export type DeviceStatus = "candidate" | "certified" | "blocked";

export type SupportedDeviceEntry = {
  manufacturer: string;
  modelContains: string[];
  status: DeviceStatus;
  region?: string;
  notes?: string;
};

export type DeviceCertification = {
  status: DeviceStatus | "unknown";
  entry: SupportedDeviceEntry | null;
  launchLimited: boolean;
  message: string;
};

const catalog = supported as {
  minAndroidApi?: number;
  devices: SupportedDeviceEntry[];
};

export function evaluateDeviceCertification(
  manufacturer?: string | null,
  model?: string | null,
): DeviceCertification {
  const mfr = (manufacturer ?? "").trim().toLowerCase();
  const mdl = (model ?? "").trim().toLowerCase();
  if (!mfr && !mdl) {
    return {
      status: "unknown",
      entry: null,
      launchLimited: true,
      message:
        "Device not identified — retail sizing is limited until this phone is certified.",
    };
  }

  for (const entry of catalog.devices) {
    const mfrOk =
      !mfr ||
      entry.manufacturer.toLowerCase() === mfr ||
      mfr.includes(entry.manufacturer.toLowerCase());
    if (!mfrOk) continue;
    const hit = entry.modelContains.some((token) =>
      mdl.includes(token.toLowerCase()),
    );
    if (!hit && mdl) continue;
    if (entry.status === "blocked") {
      return {
        status: "blocked",
        entry,
        launchLimited: true,
        message:
          "This device is blocked for retail sizing. Use a certified phone or continue for estimate-only demo.",
      };
    }
    if (entry.status === "certified") {
      return {
        status: "certified",
        entry,
        launchLimited: false,
        message: "Device cohort is certified for retail millimetre measurement.",
      };
    }
    return {
      status: "candidate",
      entry,
      launchLimited: true,
      message:
        "Device is on the launch candidate list — certify via Brannock study before treating mm as sizing truth.",
    };
  }

  return {
    status: "unknown",
    entry: null,
    launchLimited: true,
    message:
      "Device is outside the limited supported list. Measurement may continue; label results as estimate until certified.",
  };
}

export function supportedDeviceCatalog(): SupportedDeviceEntry[] {
  return catalog.devices;
}
