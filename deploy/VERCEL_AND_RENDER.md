# 🌐 How to Deploy to Render (Backend) and Vercel (Frontend)

This guide provides the easiest, free way to deploy **Group Expense Court**:
- **Backend API**: Hosted on **Render.com** (Free Node.js Web Service)
- **Frontend App**: Hosted on **Vercel.com** (Free Global Edge Hosting)
- **Database**: Hosted on **Neon.tech** (Free Serverless PostgreSQL)

---

## Part 1: Deploy Backend to Render (5 Minutes)

### Step 1: Sign Up & Create Web Service
1. Go to [render.com](https://render.com) and sign in with GitHub.
2. Click **New +** in the top right $\rightarrow$ select **Web Service**.
3. Choose **Build and deploy from a Git repository** $\rightarrow$ Click **Next**.
4. Select your repository: `eyustarX/group-expense-court`.

### Step 2: Configure Service Settings
Fill in these fields on the Render configuration page:
- **Name**: `group-expense-court-backend`
- **Region**: `Oregon (US West)` or `Ohio (US East)`
- **Branch**: `main`
- **Root Directory**: `backend` *(Important!)*
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: `Free`

### Step 3: Add Environment Variables
Scroll down to **Environment Variables** and click **Add Environment Variable**:
- `PORT` = `3001`
- `NODE_ENV` = `production`
- `FRONTEND_ORIGIN` = `*`
- `DATABASE_URL` = *[Your Neon pooled PostgreSQL connection string]*
  *(If you haven't set up Neon yet, omit this and the backend will run on its built-in COURT-4821 Demo dataset!)*
- *(Optional)* `AWS_REGION` = `us-east-1`
- *(Optional)* `BEDROCK_MODEL_ID` = `anthropic.claude-3-haiku-20240307-v1:0`

### Step 4: Deploy & Copy Your Backend URL
Click **Create Web Service**.
Render will build the app and start it. Once deployed (shows **Live** 🟢):
1. Copy your Render URL from the top left, for example:
   ```text
   https://group-expense-court-backend.onrender.com
   ```
2. Test health in your browser:
   `https://group-expense-court-backend.onrender.com/api/health`
   You should see: `{"ok":true,"status":"Court is in session"}`.

---

## Part 2: Deploy Frontend to Vercel (3 Minutes)

### Step 1: Import Project on Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** $\rightarrow$ **Project**.
3. Under **Import Git Repository**, choose `group-expense-court` $\rightarrow$ Click **Import**.

### Step 2: Configure Vercel Project
Thanks to the included `vercel.json`, Vercel configures almost everything automatically:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` *(Leave as root so Vite can access `shared/` logic)*
- **Build Command**: `cd frontend && npm install && npm run build` *(Pre-filled by vercel.json)*
- **Output Directory**: `frontend/dist` *(Pre-filled by vercel.json)*

### Step 3: Add Backend API Environment Variable
Open the **Environment Variables** dropdown and add:
- **Key**: `VITE_API_URL`
- **Value**: *[Your Render Backend URL from Part 1]*
  *(e.g. `https://group-expense-court-backend.onrender.com` — do NOT include trailing `/`)*

### Step 4: Deploy!
Click **Deploy**.
In about 45 seconds, your app will be live with a URL like:
```text
https://group-expense-court.vercel.app
```

---

## Part 3: Test Your Deployed Application

1. Open your Vercel URL in your browser or phone.
2. Click **🏛️ Enter "COURT-4821" (Demo Court as Selam)**.
3. You will see:
   - The live docket with Habesha Cultural Restaurant expenses.
   - Click **Settle Up** to view net balances and fewest payments needed.
   - Click **Hall of Shame** to view member punctuality rankings.
   - Switch language between **EN**, **አማ (Amharic)**, and **OM (Oromo)**.
4. Try creating a new court or adding an expense!

---

## 🛠️ Troubleshooting Tips

1. **CORS Error**:
   If the browser console mentions CORS, go to your Render Web Service $\rightarrow$ **Environment** $\rightarrow$ set `FRONTEND_ORIGIN` to `*` or your Vercel URL (e.g. `https://group-expense-court.vercel.app`), then restart Render.
2. **Render Free Tier Cold Starts**:
   Render free tier services spin down after 15 minutes of inactivity. The first request after sleeping may take 30–50 seconds to warm up; subsequent requests are fast.
3. **Database Setup**:
   To migrate and seed your Neon database with one click:
   ```bash
   DATABASE_URL="your-neon-url" node db/migrate.js --seed
   ```
