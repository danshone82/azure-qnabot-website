
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

      const endpoint = process.env.LANGUAGE_ENDPOINT;   // e.g., https://westeurope.api.cognitive.microsoft.com
      const key = process.env.LANGUAGE_KEY;             // Language resource key
      const project = process.env.CQA_PROJECT_NAME;     // Custom Q&A project name
      const deployment = process.env.CQA_DEPLOYMENT;    // usually "production"

      const url = `${endpoint}/language/query-knowledgebases/projects/${encodeURIComponent(project)}/deployments/${encodeURIComponent(deployment)}/qna?api-version=2023-04-01`;

      const body = { question: userText, top: 1 };

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': key,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });

        if (!resp.ok) {
          await context.sendActivity(`CQA error: ${resp.status} ${resp.statusText}`);
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
app.post('/api/messages', express.json(), (req, res) => adapter.process(req, res, (context) => bot.run(context)));

const port = process.env.PORT || 3978;
app.listen(port, () => console.log(`Bot listening on :${port}`));
