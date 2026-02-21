
# Azure Q&A Chatbot (Static Web App + Bot + Custom Q&A)

This template deploys:

- **Azure Static Web App** (frontend + `/api/token` function)
- **Node.js Bot** (App Service) that forwards questions to **Azure AI Language – Custom Question Answering**

## Prerequisites

- Azure subscription (free tier OK)
- **Language resource** with **Custom Question Answering** and a deployed project (West Europe recommended)
- **Azure Bot** resource (enable **Direct Line** channel)
- **App Service (Linux, Node 24)** to host the bot

> Direct Line tokens are minted server-side (\`/api/token\`) using the Direct Line secret; the browser never sees the secret. Tokens are short-lived and scoped to a single conversation. See Microsoft docs for **Direct Line** and **authentication**. 

## 1) Deploy the Static Web App

1. Create a **Static Web App** (Free plan), source = this GitHub repo (\`web/\` and \`api/\`).
2. After creation, copy **Deployment Token** (Overview → *Manage deployment token*) and set GitHub Secret:
   - `AZURE_STATIC_WEB_APPS_API_TOKEN = <paste>`
3. In SWA **Configuration** add:
   - `DIRECT_LINE_SECRET = <Secret from Bot → Channels → Direct Line>`
4. Push to `main` or run the **Deploy Static Web App** workflow.

## 2) Deploy the Bot

1. Create **App Service (Linux)**, Node 24.
2. In **Configuration → Application settings**, add:
   - `MicrosoftAppId = <Bot appId>`
   - `MicrosoftAppPassword = <client secret>`
   - `LANGUAGE_ENDPOINT = https://westeurope.api.cognitive.microsoft.com`
   - `LANGUAGE_KEY = <Language Key1/Key2>`
   - `CQA_PROJECT_NAME = <your-project>`
   - `CQA_DEPLOYMENT = production`
3. In **Azure Bot → Settings → Configuration**, set **Messaging endpoint** to:
   `https://<your-bot-webapp>.azurewebsites.net/api/messages`
4. From **App Service → Overview**, **Get Publish Profile** and save as GitHub secret:
   - `AZUREAPPSERVICE_PUBLISHPROFILE = <xml content>`
5. Edit `.github/workflows/deploy-bot.yml` and set `BOT_WEBAPP_NAME` to your App Service name.
6. Push or run the **Deploy Bot** workflow.

## 3) Test

- Open your **Static Web App URL**.
- Ask a question — the bot replies with the top answer from your **Custom Q&A** project.

## Notes

- For European data boundaries, consider using the **Europe** Direct Line base URI when minting tokens.
- Custom Q&A runtime requests use the Language REST endpoint (`/language/query-knowledgebases/.../qna`).

---

### Security
- Do **not** expose the Direct Line **secret** in any client code. Always exchange the secret for a **token** server-side.

