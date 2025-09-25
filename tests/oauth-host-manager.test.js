const {
  resolveHostForRequest,
  getHostById,
  getDefaultHost,
  getEnvHost,
} = require('../dist/services/oauth-host-manager.js');

describe('oauth-host-manager', () => {
  const hostsData = {
    hosts: [
      { id: 'h1', name: 'Primary', url: 'https://primary.example.com', apiKey: 'key1' },
      { id: 'h2', name: 'Secondary', url: 'https://secondary.example.com', apiKey: 'key2' },
    ],
    defaultHostId: 'h1',
  };

  test('getHostById returns matching host', () => {
    expect(getHostById(hostsData, 'h2')).toMatchObject({ id: 'h2' });
    expect(getHostById(hostsData, 'missing')).toBeUndefined();
  });

  test('getDefaultHost falls back to first host when default missing', () => {
    expect(getDefaultHost(hostsData)).toMatchObject({ id: 'h1' });
    const data = { hosts: [{ id: 'a', name: 'Only', url: 'x', apiKey: 'k' }], defaultHostId: null };
    expect(getDefaultHost(data)).toMatchObject({ id: 'a' });
  });

  test('getEnvHost returns undefined without url/key', () => {
    expect(getEnvHost({})).toBeUndefined();
    expect(getEnvHost({ url: 'https://x' })).toBeUndefined();
    expect(getEnvHost({ apiKey: 'k' })).toBeUndefined();
    expect(getEnvHost({ url: 'https://x', apiKey: 'k' })).toMatchObject({ id: 'env' });
  });

  test('resolveHostForRequest prefers URL host_id', () => {
    const host = resolveHostForRequest({
      requestUrl: 'https://server/mcp?host_id=h2',
      hostsData,
      tokenRecord: { hostId: 'h1' },
    });
    expect(host.id).toBe('h2');
  });

  test('resolveHostForRequest falls back to token host', () => {
    const host = resolveHostForRequest({
      requestUrl: 'https://server/mcp',
      hostsData,
      tokenRecord: { hostId: 'h2' },
    });
    expect(host.id).toBe('h2');
  });

  test('resolveHostForRequest uses default host when token missing', () => {
    const data = { hosts: hostsData.hosts, defaultHostId: 'h1' };
    const host = resolveHostForRequest({
      requestUrl: 'https://server/mcp',
      hostsData: data,
      tokenRecord: {},
    });
    expect(host.id).toBe('h1');
  });

  test('resolveHostForRequest falls back to env host when no configured hosts', () => {
    const emptyData = { hosts: [], defaultHostId: null };
    const host = resolveHostForRequest({
      requestUrl: 'https://server/mcp',
      hostsData: emptyData,
      envConfig: { url: 'https://env.example.com', apiKey: 'envkey' },
    });
    expect(host).toMatchObject({ id: 'env', url: 'https://env.example.com' });
  });
});
