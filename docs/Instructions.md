# **Project 2: Build Your Own Azure Q&A Chatbot Website**

**📝 What You Will Build**

By the end of this lab, you will have:

- A **public website** with a built‑in chat interface
- A **chatbot** powered by Azure Bot Service
- A **knowledge base** built from your own documents using Azure AI Language (Custom Question Answering)
- A secure **token service** powered by Azure Static Web Apps
- Full CI/CD: changing any code automatically redeploys your site

**📦 Before You Start**

You will need:

- A GitHub account
- An Azure account (free tier is fine)
- A copy of your instructor’s GitHub **template repository**

**🚀 Step 1 — Create Your GitHub Repository**

**What this does:** Creates your own copy of the template code with all the website, bot, and deployment automation files. This becomes your project's home where all code changes trigger automatic deployments.

1.  Visit the GitHub template provided by your instructor.
2.  Click **Use this template → Create a new repository**.
3.  Name it: azure-qna-chatbot
4.  Choose **Public** (recommended for class exercises) or **Private**.
5.  Click **Create repository**.

Your repo now contains:

- Frontend website (web/)
- API function (api/)
- Bot code (bot/)
- GitHub Actions for CI/CD (.github/workflows/)

**🌐 Step 2 — Create Your Azure AI Language Resource**

**What this does:** Sets up the Azure service that will host your Custom Question Answering knowledge base. This is the "brain" that stores your documents and answers questions.

This will store and process your Q&A knowledge.

1.  Go to **Azure Portal**: [https://portal.azure.com](https://portal.azure.com/)
2.  Click **Create a resource**
3.  Search for **Language Service**
4.  Click **Create**
5.  Use these settings:

| **Setting** | **Value** |
| --- | --- |
| Region | **West Europe** |
| Pricing Tier | **Free (F0)** |
| Resource Group | qna-rg (new) |
| Name | language-qna-&lt;yourname&gt; |

1.  Click **Review + Create → Create**

**📘 Step 3 — Build Your Custom Question Answering Project**

**What this does:** Creates and trains your actual knowledge base by uploading documents or adding Q&A pairs. This is where you define what your bot knows and can answer.

1.  Go to **Language Studio**: [https://language.cognitive.azure.com](https://language.cognitive.azure.com/)
2.  Sign in and select your **Language resource**.
3.  Choose **Custom Question Answering**.
4.  Click **Create new project**.
5.  Enter:
    - Project name: my-qna
    - Language: English
    - Use free Search tier if asked
6.  Add content:
    - Upload a **PDF**
    - Or add **manual Q&A pairs**
7.  Click **Save** → **Train** → **Deploy** (choose production)

Your knowledge base is now ready.

**🤖 Step 4 — Create Your Azure Bot Resource**

**What this does:** Creates the Azure Bot identity and registration. This gives your bot an official identity in Azure and enables communication channels like Direct Line for your website to connect to.

This is the identity that Direct Line and clients use.

1.  In Azure Portal → **Create a resource**
2.  Search: **Azure Bot**
3.  Click **Create**
4.  Settings:

| **Setting** | **Value** |
| --- | --- |
| Bot handle | qna-bot-&lt;yourname&gt; |
| Subscription | Your subscription |
| Resource Group | qna-rg |
| App type | **Single Tenant** |
| Region | **West Europe** |

1.  Click **Review + Create → Create**

**🔑 Step 5 — Enable Direct Line (VERY IMPORTANT)**

**What this does:** Activates the Direct Line channel, which is the secure communication protocol between your website and the bot. The secret you copy here will be used by your API to generate temporary tokens for users.

Direct Line is how your website connects to your bot.

1.  Open your Azure Bot resource
2.  Go to **Channels**
3.  Click **Direct Line**
4.  Click **Enable**
5.  Copy the **Secret** (we will use it soon)

**⚠️ Never expose this secret in frontend code.**

**🏗️ Step 6 — Deploy Your Bot Code (App Service)**

**What this does:** Deploys the Node.js bot application that receives messages from users, forwards questions to your Custom Q&A knowledge base, and returns answers. This is the "middleware" between Azure Bot Service and your AI Language resource.

This runs the code that talks to your Custom Q&A project.  
**Summary**

|     |     |     |
| --- | --- | --- |
| **Sub‑Step** | **What You’re Doing** | **Why It Matters** |
| **A) Create App Service** | Hosting your bot code online | Gives your bot a URL and place to run |
| **B) Add Environment Variables** | Providing IDs, secrets, and endpoints | Allows the bot to authenticate and call your Q&A knowledge |
| **C) Configure Messaging Endpoint** | Connecting Azure Bot → App Service | Azure must know where your bot lives |
| **D) GitHub Deployment** | Setting up auto‑deployment | Keeps your bot code updated automatically |

  

**A) Create the App Service**

1.  Azure Portal → **Create a resource**
2.  Search: **Web App**
3.  Settings:

| **Setting** | **Value** |
| --- | --- |
| Name | qna-botapp-&lt;yourname&gt; |
| Publish | Code |
| Runtime | **Node 18 LTS** (or Node 20/24) |
| Region | West Europe |
| Pricing | Free F1 |

1.  Click **Create**

**B) Configure Environment Variables**

**What this does:** Provides your bot with all the credentials and endpoints it needs to authenticate with Azure Bot Service and query your Custom Q&A knowledge base.

Go to:

**App Service → Configuration → Application settings → Add**

Add each of these:

| **Name** | **Value** | **Where to Find It** |
| --- | --- | --- |
| MicrosoftAppId | Your bot's App ID | Azure Bot → Settings → Configuration |
| MicrosoftAppPassword | Client Secret | App Registration (click blue "Manage" link next to AppId) → Certificates & secrets → New client secret |
| MicrosoftAppTenantId | Your Azure tenant ID | Azure Bot → Settings → Configuration (or App Registration → Overview) |
| LANGUAGE_ENDPOINT | https://westeurope.api.cognitive.microsoft.com | Language resource → Keys and Endpoint |
| LANGUAGE_KEY | Your Language resource key | Language resource → Keys and Endpoint (Key 1 or Key 2) |
| CQA_PROJECT_NAME | my-qna | The project name you created in Language Studio (Step 3) |
| CQA_DEPLOYMENT | production | The deployment name (usually "production") |

Click **Save** → **Restart** the App Service.

**C) Configure Messaging Endpoint**

**What this does:** Tells Azure Bot Service where to send incoming messages. This connects the Bot resource to your App Service so messages flow to your bot code.

Back in **Azure Bot → Settings → Configuration:**

Set:

https://qna-botapp-&lt;yourname&gt;.azurewebsites.net/api/messages

Click **Save**.

**D) Deploy Your Bot Using GitHub Actions**

**Steps explained**

1\. Get Publish Profile (XML)  
_This is a credential file that GitHub Actions uses to deploy securely._

2\. Add it as a GitHub Secret  
_This hides it safely inside GitHub._

3\. Tell GitHub which App Service to deploy into  
_You edit:_

_BOT_WEBAPP_NAME: qna-botapp-&lt;yourname&gt;_

4\. Push code or run the workflow  
_GitHub Actions uploads the bot code to your App Service automatically._

**Instructions**

1.  In App Service → **Overview**, click **Get Publish Profile**
2.  Download the XML file
3.  In GitHub → go to **Settings → Secrets and Variables → Actions**
4.  Create a secret:

AZUREAPPSERVICE_PUBLISHPROFILE = &lt;paste entire XML here&gt;

5\. In your repo → open:

.github/workflows/deploy-bot.yml

Edit:

BOT_WEBAPP_NAME: qna-botapp-&lt;yourname&gt;

6\. Push a commit or manually run the workflow.

Your bot deploys automatically.

**🧪 Step 7 — Test Your Bot**

**What this does:** Verifies that your bot can successfully receive messages and query your Custom Q&A knowledge base. This confirms the entire backend pipeline is working before connecting the website.

In Azure Bot → **Test in Web Chat**

Try typing:

What is this project about?

If you receive an answer from your Custom Q&A project, you’re ready for the website.

**🌍 Step 8 — Deploy Your Website + API (Static Web App)**

**What this does:** Deploys your public-facing website with the chat interface and the secure token API. The API exchanges your Direct Line secret for temporary tokens, keeping the secret safe on the server while allowing users to chat securely.

**A) Create Static Web App**

1.  Azure Portal → Create resource
2.  Search **Static Web App**
3.  Create with:

| **Setting** | **Value** |
| --- | --- |
| Name | qna-swa-&lt;yourname&gt; |
| Plan | Free |
| Region | West Europe |
| Source | GitHub |
| App location | /web |
| Api location | /api |

**B) Add Deployment Token to GitHub**

1.  In Static Web App → **Overview**
2.  Click **Manage deployment token**
3.  In GitHub → Secrets → Actions, add:

AZURE_STATIC_WEB_APPS_API_TOKEN = &lt;paste&gt;

**C) Add the Direct Line Secret**

**What this does:** Provides your token API with the Direct Line secret so it can generate temporary tokens for website visitors. This keeps the secret secure on the server side.

1.  Static Web App → **Configuration** → **Application settings**
2.  Add:

DIRECT_LINE_SECRET = &lt;Direct Line secret from Step 5&gt;

**IMPORTANT:** Also add this setting to ensure the correct regional endpoint is used:

DIRECT_LINE_BASE_URL = https://europe.directline.botframework.com

Click **Save**, then **Restart**.

**D) Deploy**

Push any commit or run **Deploy Static Web App (web + api)** workflow.

**💬 Step 9 — Test Your Public Chat Website**

**What this does:** Verifies the complete end-to-end flow: website → token API → Direct Line → Azure Bot → your bot code → Custom Q&A → answer back to user.

1.  Go to your Static Web App URL: [https://qna-swa-](https://qna-swa-/).azurestaticapps.net
2.  A chat interface loads.
3.  Ask your question!

Example:

Summarize the document I uploaded.

You should see your knowledge‑based answer appear instantly.

**🛠️ Troubleshooting Guide**

**❌ Website says “Unable to obtain Direct Line token”**

Fix:

- In SWA → Configuration, ensure:
- DIRECT_LINE_SECRET = &lt;correct secret&gt;

**❌ Bot gives no answers**

Check:

- Messaging endpoint is correct
- Bot App Service has correct environment variables
- Custom Q&A project is **trained & deployed**

**❌ CORS errors**

Static Web Apps auto‑proxies requests; no CORS config needed.

**🎉 Final Result**

You now have:

- A **deployed website**
- A **Custom Q&A-powered chatbot**
- Secure Direct Line token flow
- Automatic deployments through GitHub Actions
- A complete Azure AI Showcase project for your portfolio