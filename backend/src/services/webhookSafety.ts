import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { config } from "../config.js";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
  "instance-data",
]);

function ipv4Octets(ip: string): number[] | null {
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(ip);
  if (!m) return null;
  return m.slice(1).map((n) => Number(n));
}

export function isPrivateOrReservedIp(ip: string): boolean {
  const v4 = ipv4Octets(ip);
  if (v4) {
    const [a, b] = v4;
    if (a === 10) return true;
    if (a === 127) return true;
    if (a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    if (a === 192 && b === 0 && v4[2] === 2) return true;
    return false;
  }
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80")) {
    return true;
  }
  return false;
}

export async function assertSafeWebhookUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw Object.assign(new Error("webhook_url_invalid"), { status: 400 });
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw Object.assign(new Error("webhook_url_protocol"), { status: 400 });
  }
  if (config.isProduction && url.protocol !== "https:") {
    throw Object.assign(new Error("webhook_https_required"), { status: 400 });
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (BLOCKED_HOSTS.has(host) || host.endsWith(".localhost")) {
    if (config.isProduction) {
      throw Object.assign(new Error("webhook_host_blocked"), { status: 400 });
    }
  }
  if (isIP(host) && isPrivateOrReservedIp(host)) {
    throw Object.assign(new Error("webhook_private_ip"), { status: 400 });
  }
  if (!isIP(host)) {
    const answers = await lookup(host, { all: true }).catch(() => {
      throw Object.assign(new Error("webhook_host_unresolvable"), { status: 400 });
    });
    for (const a of answers) {
      if (isPrivateOrReservedIp(a.address)) {
        throw Object.assign(new Error("webhook_private_ip"), { status: 400 });
      }
    }
  }
  return url;
}
