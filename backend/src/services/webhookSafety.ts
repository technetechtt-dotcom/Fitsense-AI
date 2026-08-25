import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { config } from "../config.js";

const BLOCKED_HOSTS = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.google.com",
  "instance-data",
]);

/** Disallow link-local metadata and other non-public destinations. */
const BLOCKED_PORTS_PRODUCTION = new Set([22, 25, 2375, 2376, 6443, 10250]);

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
  // IPv4-mapped IPv6
  if (lower.startsWith("::ffff:")) {
    const mapped = lower.slice("::ffff:".length);
    if (isIP(mapped) === 4) return isPrivateOrReservedIp(mapped);
  }
  return false;
}

async function resolveAndAssertPublic(host: string): Promise<string[]> {
  const answers = await lookup(host, { all: true }).catch(() => {
    throw Object.assign(new Error("webhook_host_unresolvable"), { status: 400 });
  });
  const ips = answers.map((a) => a.address);
  for (const ip of ips) {
    if (isPrivateOrReservedIp(ip)) {
      throw Object.assign(new Error("webhook_private_ip"), { status: 400 });
    }
  }
  return ips;
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
  // Credentials in URL enable open-proxy style abuse.
  if (url.username || url.password) {
    throw Object.assign(new Error("webhook_url_credentials"), { status: 400 });
  }
  if (url.hash) {
    throw Object.assign(new Error("webhook_url_fragment"), { status: 400 });
  }
  const port = url.port ? Number(url.port) : url.protocol === "https:" ? 443 : 80;
  if (config.isProduction && BLOCKED_PORTS_PRODUCTION.has(port)) {
    throw Object.assign(new Error("webhook_port_blocked"), { status: 400 });
  }
  if (config.isProduction && port !== 443 && port !== 80) {
    // Allow only standard web ports in production (reduces SSRF surface).
    throw Object.assign(new Error("webhook_port_blocked"), { status: 400 });
  }

  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (
    BLOCKED_HOSTS.has(host) ||
    host.endsWith(".localhost") ||
    host.endsWith(".local")
  ) {
    if (config.isProduction) {
      throw Object.assign(new Error("webhook_host_blocked"), { status: 400 });
    }
  }
  if (isIP(host) && isPrivateOrReservedIp(host)) {
    throw Object.assign(new Error("webhook_private_ip"), { status: 400 });
  }
  if (!isIP(host)) {
    await resolveAndAssertPublic(host);
  }
  return url;
}

/**
 * Re-resolve immediately before fetch to mitigate DNS rebinding between
 * validation time and delivery time. Callers must use `redirect: "error"`.
 */
export async function assertSafeWebhookUrlAtDelivery(raw: string): Promise<URL> {
  const url = await assertSafeWebhookUrl(raw);
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!isIP(host)) {
    await resolveAndAssertPublic(host);
  }
  return url;
}
