
export default async function (context, req) {
  try {
    const secret = process.env.DIRECT_LINE_SECRET;
    if (!secret) {
      context.res = { status: 500, body: 'Missing DIRECT_LINE_SECRET setting' };
      return;
    }

    // Allow an optional base URL for regional Direct Line endpoints (e.g. https://europe.directline.botframework.com)
    const base = (process.env.DIRECT_LINE_BASE_URL || 'https://europe.directline.botframework.com').replace(/\/+$/, '');
    const url = `${base}/v3/directline/tokens/generate`;

    // Log the URL we will call and whether a secret is present (do NOT log the secret value)
    context.log && context.log.info && context.log.info('Requesting Direct Line token', { url, hasSecret: !!secret });

    // Use native https request instead of global fetch to avoid runtime incompatibilities
    const https = await import('https');
    const { URL } = await import('url');
    const u = new URL(url);

    const requestBody = JSON.stringify({});
    const options = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(requestBody) }
    };

    const resp = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode, statusText: res.statusMessage, text: async () => data, json: async () => { try { return JSON.parse(data); } catch { return data; } } });
        });
      });
      req.on('error', reject);
      req.write(requestBody);
      req.end();
    });

    if (!resp.ok) {
      // Try to surface response body for easier debugging
      let respBody = '';
      try { respBody = await resp.text(); } catch (e) { respBody = ''; }
      context.log && context.log.error && context.log.error('Direct Line token error', { url, status: resp.status, body: respBody });
      context.res = { status: 500, body: `Direct Line token error: ${resp.status} ${resp.statusText} - ${respBody}` };
      return;
    }

    const json = await resp.json();
    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { token: json.token } };
  } catch (e) {
    context.log && context.log.error && context.log.error('Token server exception', e?.message || e);
    context.res = { status: 500, body: e?.message || 'Token server error' };
  }
}
