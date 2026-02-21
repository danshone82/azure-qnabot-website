export default async function (context, req) {
  try {
    const secret = process.env.DIRECT_LINE_SECRET;
    if (!secret) {
      context.res = { status: 500, body: 'Missing DIRECT_LINE_SECRET setting' };
      return;
    }

    // Allow an optional base URL for regional Direct Line endpoints.
    // Default to the Europe endpoint since your resources are in West Europe.
    // Docs (global + regional base URIs): https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-direct-line-3-0-api-reference?view=azure-bot-service-4.0  [1](https://stackoverflow.com/questions/43462995/msal-azure-mobileservice-and-auto-rest-calls-get-401-unauthorized)
    const base = (process.env.DIRECT_LINE_BASE_URL || 'https://europe.directline.botframework.com').replace(/\/+$/, '');
    const url = `${base}/v3/directline/tokens/generate`;

    // (Safe) log
    if (context.log?.info) context.log.info('Requesting Direct Line token', { url, hasSecret: true });

    // Use https request
    const https = await import('https');
    const { URL } = await import('url');
    const u = new URL(url);

    const requestBody = JSON.stringify({});
    const options = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        Authorization: `Bearer ${secret}`, // Use your Direct Line **secret** server-side to mint a short-lived token  [2](https://learn.microsoft.com/en-us/answers/questions/692461/message-aadsts700016-application-with-identifier-n)
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const resp = await new Promise((resolve, reject) => {
      const req2 = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            ok,
            status: res.statusCode,
            statusText: res.statusMessage,
            text: async () => data,
            json: async () => {
              try { return JSON.parse(data); } catch { return data; }
            }
          });
        });
      });
      req2.on('error', reject);
      req2.write(requestBody);
      req2.end();
    });

    if (!resp.ok) {
      let respBody = '';
      try { respBody = await resp.text(); } catch { /* ignore */ }
      if (context.log?.error) context.log.error('Direct Line token error', { url, status: resp.status, body: respBody });
      context.res = { status: 500, body: `Direct Line token error: ${resp.status} ${resp.statusText} - ${respBody}` };
      return;
    }

    const json = await resp.json();
    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { token: json.token } };
  } catch (e) {
    if (context.log?.error) context.log.error('Token server exception', e?.message || e);
    context.res = { status: 500, body: e?.message || 'Token server error' };
  }
}