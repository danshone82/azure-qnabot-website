
export default async function (context, req) {
  try {
    const secret = process.env.DIRECT_LINE_SECRET;
    if (!secret) {
      context.res = { status: 500, body: 'Missing DIRECT_LINE_SECRET setting' };
      return;
    }

    // For regional bots, you may use https://europe.directline.botframework.com
    const resp = await fetch('https://directline.botframework.com/v3/directline/tokens/generate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` }
    });

    if (!resp.ok) {
      context.res = { status: 500, body: `Direct Line token error: ${resp.status} ${resp.statusText}` };
      return;
    }

    const json = await resp.json();
    context.res = { status: 200, headers: { 'Content-Type': 'application/json' }, body: { token: json.token } };
  } catch (e) {
    context.res = { status: 500, body: e?.message || 'Token server error' };
  }
}
