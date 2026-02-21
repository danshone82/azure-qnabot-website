
import 'dotenv/config';
import express from 'express';
import {
  CloudAdapter,
  ConfigurationServiceClientCredentialFactory,
  createBotFrameworkAuthenticationFromConfiguration,
  ActivityHandler
} from 'botbuilder';

// Bot credentials from Azure Bot (App Registration)
const credentialsFactory = new ConfigurationServiceClientCredentialFactory({
  MicrosoftAppId: process.env.MicrosoftAppId,
  MicrosoftAppPassword: process.env.MicrosoftAppPassword,
  MicrosoftAppTenantId: process.env.MicrosoftAppTenantId,
  MicrosoftAppType: 'SingleTenant'
});

const botFrameworkAuthentication = createBotFrameworkAuthenticationFromConfiguration(null, credentialsFactory);
const adapter = new CloudAdapter(botFrameworkAuthentication);

class CQABot extends ActivityHandler {
  constructor() {
    super();

    this.onMessage(async (context, next) => {
      const userText = context.activity.text?.trim();
      if (!userText) {
        await context.sendActivity('Please type a question.');
        return;
      }

      // Read + sanitize env vars
      const endpoint = (process.env.LANGUAGE_ENDPOINT || '').replace(/\/+$/, ''); // remove trailing slash
      const key = process.env.LANGUAGE_KEY;             // Language resource key
      const project = process.env.CQA_PROJECT_NAME;     // Custom Q&A project name (case-sensitive)
      const deployment = process.env.CQA_DEPLOYMENT;    // usually "production"

      const path = `/language/query-knowledgebases/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(deployment)}/qna?api-version=2023-04-01`;
      const url = `${endpoint}${path}`;

      const body = { question: userText, top: 1 };

      try {
        const headers = { 'Content-Type': 'application/json' };
        if (key) {
          // Some endpoints accept 'Ocp-Apim-Subscription-Key', newer endpoints accept 'api-key'
          headers['Ocp-Apim-Subscription-Key'] = key;
          headers['api-key'] = key;
        }

        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (!resp.ok) {
          // Capture response body for debugging (trim to avoid huge messages)
          const respText = await resp.text();
          console.error('CQA request failed', { url, status: resp.status, statusText: resp.statusText, body: respText });
          await context.sendActivity(`CQA error: ${resp.status} ${resp.statusText} - ${respText ? respText.slice(0,200) : ''}`);
        } else {
          const data = await resp.json();
          const topAnswer = data?.answers?.[0]?.answer || "Sorry, I couldn't find an answer.";
          await context.sendActivity(topAnswer);
        }
      } catch (err) {
        await context.sendActivity(`CQA request failed: ${err?.message || err}`);
      }

      await next();
    });
  }
}

const bot = new CQABot();

const app = express();

// Basic validation + error handling for incoming activity requests
app.post('/api/messages', express.json(), async (req, res) => {
  try {
    // Guard against invalid requests (some probes or misrouted requests may be empty)
    if (!req.body || !req.body.type) {
      console.warn('Received invalid activity request:', {
        method: req.method,
        path: req.path,
        headers: req.headers['user-agent'],
        body: req.body
      });
      return res.status(400).send('Invalid activity payload');
    }

    await adapter.process(req, res, async (context) => {
      await bot.run(context);
    });
  } catch (err) {
    console.error('Failed to process activity:', err);
    try { res.status(500).send('Server error'); } catch (e) { /* ignore */ }
  }
});

const port = process.env.PORT || 3978;
app.listen(port, () => console.log(`Bot listening on :${port}`));
