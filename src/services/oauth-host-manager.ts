export interface HostEntry {
  id: string;
  name: string;
  url: string;
  apiKey: string;
  createdAt?: string;
}

export interface HostsData {
  hosts: HostEntry[];
  defaultHostId: string | null;
}

export interface TokenRecordLike {
  hostId?: string | null;
}

export interface EnvHostConfig {
  url?: string;
  apiKey?: string;
}

export interface ResolveOptions {
  requestUrl: string;
  hostsData: HostsData;
  tokenRecord?: TokenRecordLike | null;
  envConfig?: EnvHostConfig;
}

export function getHostById(hostsData: HostsData, id?: string | null): HostEntry | undefined {
  if (!id) return undefined;
  return hostsData.hosts.find((host) => host.id === id);
}

export function getDefaultHost(hostsData: HostsData): HostEntry | undefined {
  if (hostsData.defaultHostId) {
    const host = getHostById(hostsData, hostsData.defaultHostId);
    if (host) return host;
  }
  return hostsData.hosts[0];
}

export function getEnvHost(config?: EnvHostConfig): HostEntry | undefined {
  if (!config?.url || !config?.apiKey) return undefined;
  return {
    id: 'env',
    name: 'Environment Host',
    url: config.url,
    apiKey: config.apiKey,
  };
}

export function resolveHostForRequest(options: ResolveOptions): HostEntry | undefined {
  const { requestUrl, hostsData, tokenRecord, envConfig } = options;
  let urlHostId: string | null = null;
  try {
    const parsed = new URL(requestUrl, 'http://localhost');
    urlHostId = parsed.searchParams.get('host_id') || parsed.searchParams.get('hostId');
  } catch {
    // ignore parse errors, fall back to defaults
  }

  const candidateIds: Array<string | null | undefined> = [
    urlHostId,
    tokenRecord?.hostId,
    hostsData.defaultHostId,
  ];

  for (const candidate of candidateIds) {
    const host = getHostById(hostsData, candidate ?? undefined);
    if (host) {
      return host;
    }
  }

  const envHost = getEnvHost(envConfig);
  if (envHost) return envHost;

  return undefined;
}
