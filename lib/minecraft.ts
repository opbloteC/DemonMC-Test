import type { ServerStatus } from "./types";

interface StatusApiResponse {
  online?: boolean;
  players?: {
    online?: number;
    max?: number;
    list?: Array<{ name_clean?: string; name_raw?: string } | null>;
  };
  version?: { name_clean?: string } | string;
  motd?: { clean?: string | string[] };
}

export async function getServerStatus(host: string): Promise<ServerStatus> {
  const edition = process.env.MC_EDITION === "bedrock" ? "bedrock" : "java";
  const address = (process.env.MC_STATUS_HOST || host).trim();
  const checkedAt = new Date().toISOString();

  if (!address) {
    return { reachable: false, online: false, players: null, version: null, checkedAt };
  }

  const url = `https://api.mcstatus.io/v2/status/${edition}/${encodeURI(address)}`;

  try {
    const res = await fetch(url, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(9000),
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Status API responded ${res.status}`);

    const data = (await res.json()) as StatusApiResponse;
    const version =
      typeof data.version === "string" ? data.version : (data.version?.name_clean ?? null);

    return {
      reachable: true,
      online: Boolean(data.online),
      players: data.players
        ? {
            online: Math.max(0, Number(data.players.online) || 0),
            max: Math.max(0, Number(data.players.max) || 0),
            names: (data.players.list ?? [])
              .map((entry) => entry?.name_clean || entry?.name_raw || "")
              .filter((name) => name.length > 0),
          }
        : null,
      version,
      checkedAt,
    };
  } catch {
    return { reachable: false, online: false, players: null, version: null, checkedAt };
  }
}
