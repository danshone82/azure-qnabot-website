
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

    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({})
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
