module.exports = async function (context, req) {
  try {
    const secret = process.env.DIRECT_LINE_SECRET;
    if (!secret) {
      context.res = { status: 500, body: 'Missing DIRECT_LINE_SECRET setting' };
      return;
    }

    // Regional base URI (defaults to Europe for West Europe setups).
    const base = (process.env.DIRECT_LINE_BASE_URL || 'https://europe.directline.botframework.com').replace(/\/+$/, '');
    const url = `${base}/v3/directline/tokens/generate`;

    const https = require('https');
    const { URL } = require('url');
    const u = new URL(url);

    const requestBody = JSON.stringify({});
    const options = {
      method: 'POST',
      hostname: u.hostname,
      port: u.port || 443,
      path: u.pathname + u.search,
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const resp = await new Promise((resolve, reject) => {
      const r = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const ok = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            ok,
            status: res.statusCode,
            statusText: res.statusMessage,
            bodyText: data
          });
        });
      });
      r.on('error', reject);
      r.write(requestBody);
      r.end();
    });

    // Debug mode: return EXACT upstream body/status so we can see what's happening
    const debug = req?.query?.debug === '1';

    if (!resp.ok) {
      if (debug) {
        context.res = {
          status: resp.status,
          headers: { 'Content-Type': 'text/plain' },
          body: resp.bodyText || '(empty upstream body)'
        };
      } else {
        context.res = {
          status: 500,
          headers: { 'Content-Type': 'text/plain' },
          body: `Direct Line token error: ${resp.status} ${resp.statusText} - ${resp.bodyText || '(no message)'}`
        };
      }
      return;
    }

    // Try to parse JSON; if parsing fails, surface the raw text
    let json;
    try {
      json = JSON.parse(resp.bodyText);
    } catch {
      context.res = { status: 500, body: `Unexpected Direct Line response: ${resp.bodyText || '(empty)'}` };
      return;
    }

    if (!json?.token) {
      context.res = { status: 500, body: `No token in Direct Line response: ${resp.bodyText || '(empty)'}` };
      return;
    }

    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { token: json.token } };
  } catch (e) {
    context.res = { status: 500, body: e?.message || 'Token server error' };
  }
}