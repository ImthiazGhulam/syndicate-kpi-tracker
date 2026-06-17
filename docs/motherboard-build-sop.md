# The Motherboard Build SOP

## How to Build Your Own Coaching Platform Using AI

This guide walks you through building your own version of a client management and coaching platform — even if you've never coded anything in your life. You'll use AI (Claude) to do all the heavy lifting. You just need to follow the steps and make decisions about what YOUR version looks like.

**What you'll end up with:**
- A web app your clients log into
- Daily, weekly, and monthly tracking tools
- Interactive playbooks (your own frameworks)
- AI-generated action plans based on client input
- An admin dashboard where you see everything
- Works on mobile and desktop

**Time to build:** 1-2 weeks (a few hours per day)
**Cost:** ~$20-40/month to run (Supabase free tier + Vercel free tier + Claude API usage)

---

## Before You Start

You need:
- A laptop or desktop computer (not a phone)
- An email address
- A credit/debit card (for Claude API — you only pay for what you use)
- A clear idea of what your clients need to track and the frameworks you teach

**You do NOT need:**
- Coding experience
- A developer
- Technical knowledge

---

## Part 1: Set Up Your Accounts (30 minutes)

You need four free accounts. Do these one at a time.

### 1A: GitHub (where your code lives)

1. Go to github.com
2. Click "Sign up"
3. Use your email, create a username and password
4. Verify your email
5. When asked about preferences, skip everything — just get to the dashboard

### 1B: Supabase (your database — where all client data is stored)

1. Go to supabase.com
2. Click "Start your project"
3. Sign in with your GitHub account (this is easiest)
4. Click "New Project"
5. Give it a name (e.g., "my-coaching-platform")
6. Set a database password — **write this down somewhere safe, you'll need it later**
7. Choose the region closest to your clients (e.g., London for UK)
8. Click "Create new project"
9. Wait 2-3 minutes for it to set up

**Once it's ready, get your keys:**
1. In Supabase, go to Settings (gear icon, bottom left) → API
2. You'll see two things you need — copy them somewhere safe:
   - **Project URL** (starts with https://)
   - **anon public key** (a long string of letters and numbers)

### 1C: Vercel (hosts your website)

1. Go to vercel.com
2. Click "Sign up"
3. Choose "Continue with GitHub"
4. Authorise Vercel to access your GitHub

### 1D: Anthropic / Claude API (the AI that generates content and plans)

1. Go to console.anthropic.com
2. Click "Sign up"
3. Create an account with your email
4. Once logged in, go to "API Keys" in the left menu
5. Click "Create Key"
6. Name it something like "my-platform"
7. **Copy the key immediately and save it somewhere safe** — you won't see it again
8. Go to "Plans & Billing" and add a payment method. You'll only be charged for what you use (typically a few pounds per month)

---

## Part 2: Set Up Claude (Your AI Builder) (15 minutes)

Claude is the AI that will build your entire platform. There are two ways to use it:

### Option A: Claude Code (Recommended — most powerful)

Claude Code is a tool that runs in your terminal (the command line on your computer). It can create files, write code, and deploy your app directly.

**To install:**
1. Open Terminal (Mac: search "Terminal" in Spotlight) or Command Prompt (Windows: search "cmd")
2. First, install Node.js if you don't have it:
   - Go to nodejs.org
   - Download the LTS version
   - Run the installer, click "Next" through everything
3. Once Node.js is installed, go back to Terminal and type:
   ```
   npm install -g @anthropic-ai/claude-code
   ```
4. Press Enter and wait for it to install
5. Once done, type:
   ```
   claude
   ```
6. It will ask you to log in — follow the prompts to connect your Anthropic account

**If this feels too technical, use Option B instead.**

### Option B: Claude Chat (Simpler — copy and paste)

1. Go to claude.ai
2. Log in with your Anthropic account
3. You'll paste prompts into the chat and Claude will give you code
4. You'll then need to create files manually (Claude will tell you where)

**Either way works.** Option A is faster because Claude creates the files directly. Option B means more copying and pasting but nothing else to install.

---

## Part 3: Define Your Platform (30-60 minutes)

Before you build anything, you need to answer these questions. Write your answers down — you'll feed them to Claude.

### Your Brand
- What's your business/programme called?
- What's your primary colour? (e.g., gold, blue, green — give the hex code if you have one)
- Do you have a logo? (If yes, have the image file ready)

### Your Clients
- Who are your clients? (e.g., coaches, PTs, consultants)
- How many clients do you currently have?
- What information do you need from each client? (name, email, phone, business name, etc.)

### What Do Your Clients Need to Track?

Think about what your clients should be doing daily, weekly, monthly, and yearly. For each one, write down:

**Daily tools (things they do every day):**
- Do they need a morning check-in? What questions would you ask?
- Do they track any numbers daily? (leads, calls, sales, content posted, etc.)
- Do they need an evening reflection? What questions?
- Do they track leads or prospects? (a pipeline/kanban board)

**Weekly tools:**
- Do they do a weekly review? What do they reflect on?
- Do they plan the upcoming week? What do they set?

**Monthly tools:**
- Monthly review? What do they reflect on?
- Revenue tracking? Targets?

**Yearly tools:**
- Annual goal setting?
- Vision/life design exercise?

### Your Frameworks / Playbooks

This is the most important part. Think about the frameworks or methodologies you teach. For each one:

- What's it called?
- How many stages or steps does it have?
- What does the client fill in at each stage?
- Is there a scoring system? (e.g., complete 80% to unlock the next step)
- Should AI generate an action plan based on their answers?

**Example:** "I have a 5-stage offer building framework. Stage 1: Define your ideal client. Stage 2: Map their journey. Stage 3: Build your main offer. Stage 4: Create an entry offer. Stage 5: Plan your delivery model. Each stage has 5-10 questions. Once they complete 80%, AI generates a 30-day launch plan."

### Admin Dashboard

What do you need to see as the coach?
- All clients' progress at a glance?
- Who's falling behind?
- Revenue across all clients?
- Ability to view each client's data?
- Ability to leave feedback?

---

## Part 4: Build It (The Master Prompt)

Now you feed everything to Claude. This is where the magic happens.

### If Using Claude Code (Option A):

1. Open Terminal
2. Create a folder for your project:
   ```
   mkdir my-coaching-platform
   cd my-coaching-platform
   ```
3. Start Claude:
   ```
   claude
   ```
4. Paste the Master Prompt below (with YOUR answers filled in)

### If Using Claude Chat (Option B):

1. Go to claude.ai
2. Start a new conversation
3. Paste the Master Prompt below

---

### THE MASTER PROMPT

Copy everything below, fill in the sections marked with [BRACKETS], and paste it to Claude:

```
I need you to build me a complete coaching platform web application. I'm not a developer — I need you to create every single file, explain what to do with each one, and guide me through deploying it.

TECH STACK (use exactly these):
- Next.js (App Router) with JavaScript (no TypeScript)
- Tailwind CSS for styling
- Supabase for database and authentication (magic link email login)
- Anthropic Claude API for AI generation
- Deployed on Vercel

MY BUSINESS:
- Business name: [YOUR BUSINESS NAME]
- Primary colour: [YOUR COLOUR, e.g., #C9A84C for gold]
- Admin email (my email): [YOUR EMAIL]
- Client type: [WHO YOUR CLIENTS ARE, e.g., "coaches and consultants"]

AUTHENTICATION:
- Magic link email login (no passwords)
- Only pre-approved users can log in (I add them manually in Supabase)
- If the logged-in user's email matches my admin email, redirect to /admin
- Everyone else goes to /client

CLIENT DASHBOARD (/client):
- Sidebar navigation on the left (collapsible on mobile)
- Dark theme: background zinc-950, cards zinc-800/900, borders zinc-700
- Primary accent colour: [YOUR COLOUR]
- Mobile-first (must work perfectly on iPhone)

The client dashboard needs these sections:
[LIST YOUR DAILY/WEEKLY/MONTHLY/YEARLY TOOLS HERE — be specific about what fields each one has]

Example format:
"Morning Check-in (daily):
- How are you feeling today? (1-10 rating)
- What's your #1 priority today? (text)
- 3 things you're grateful for (3 text fields)
- Did you read your affirmations? (yes/no checkbox)
Save to a 'morning_checkin' table with client_id and date"

[ADD ALL YOUR TOOLS IN THIS FORMAT]

PLAYBOOKS:
[FOR EACH FRAMEWORK/PLAYBOOK, DESCRIBE IT LIKE THIS:]

"[PLAYBOOK NAME] (route: /[url-path]):
- Stage 1: [NAME] — [describe what the client fills in, what fields, what options]
- Stage 2: [NAME] — [same]
- Stage 3: [NAME] — [same]
(etc.)
- Scoring: [how completion is measured]
- AI Generation: When they reach [threshold], generate a [describe the output — e.g., 30-day action plan]
- The AI prompt should reference their specific answers, not give generic advice"

[ADD ALL YOUR PLAYBOOKS]

ADMIN DASHBOARD (/admin):
[DESCRIBE WHAT YOU NEED TO SEE — e.g.:]
- List of all clients with their programme scores
- Click into any client to see their full data (read-only)
- Revenue tracking across all clients
- Who's falling behind (drop-off detection)
- Ability to leave feedback

CRITICAL ARCHITECTURE RULES:
1. All pages use 'use client' directive (client-side rendering with Supabase auth)
2. Root layout must have: export const dynamic = 'force-dynamic'
3. DO NOT use headers() from next/headers — it causes 500 errors
4. Auto-save on input blur with 500ms debounce (not on every keystroke)
5. All sub-components defined OUTSIDE the main component function (prevents mobile keyboard issues)
6. Toast notifications using useRef (not setState) to avoid re-renders
7. Playbook pages split into: page.js (thin wrapper) + [Name]Client.js (full client component)
8. Supabase client in lib/supabase.js — single import everywhere
9. API routes in app/api/ — lazy-init Supabase (not top-level)
10. All scores capped at 100%
11. Store active tab in localStorage so it persists on refresh
12. Every table needs Row Level Security (RLS) policies

SUPABASE SETUP:
After generating the code, give me:
1. The complete SQL to create all tables (with proper types, defaults, and foreign keys)
2. All RLS policies
3. All indexes
4. Instructions for setting up auth (magic link email, redirect URLs)

Format the SQL so I can paste it into Supabase SQL Editor one statement at a time.

DEPLOYMENT:
After generating all the code, give me step-by-step instructions to:
1. Push the code to GitHub
2. Connect to Vercel
3. Set environment variables
4. Deploy
5. Test the login flow

Start by creating the project structure and all files. Build the complete application — don't give me a skeleton or placeholder. Every page should be fully functional.
```

---

## Part 5: Work With Claude to Build It

Once you paste the Master Prompt, Claude will start generating your platform. Here's what to expect:

### If Using Claude Code:
- Claude will create all files directly in your project folder
- It will tell you when to run commands (like `npm install`)
- It will generate the SQL for your database
- Follow its instructions step by step

### If Using Claude Chat:
- Claude will give you the code for each file
- Create the files on your computer in the right locations (Claude will tell you where)
- Or ask Claude: "Can you give me all the terminal commands to create these files?"

### Tips for Working With Claude:

**If something doesn't work:**
Say: "This isn't working — here's the error: [paste the error]. Fix it."

**If you want to change something:**
Say: "Change the morning check-in to include a field for [whatever you want]"

**If you want to add a feature:**
Say: "Add a new section to the client dashboard called [name] that does [description]"

**If you're confused:**
Say: "I don't understand what to do next. Give me the exact steps, one at a time, as if I've never used a computer before."

**If Claude gives you too much at once:**
Say: "Slow down. Give me one file at a time and tell me exactly what to do with it."

---

## Part 6: Set Up Supabase (Your Database)

Claude will give you SQL code to create your database tables. Here's how to run it:

1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left menu
3. Click "New query"
4. Paste the FIRST SQL statement Claude gave you
5. Click "Run" (the play button)
6. If it says "Success" — move to the next statement
7. Repeat for every SQL statement

**Important:** Run them one at a time. If you get an error, copy the error and paste it to Claude — it'll tell you how to fix it.

### Set Up Authentication:

1. In Supabase, go to Authentication → URL Configuration
2. Set "Site URL" to your Vercel URL (you'll get this in Part 7)
3. Add to "Redirect URLs": `https://your-app.vercel.app/auth/callback`
4. Go to Authentication → Email Templates
5. (Optional) Customise the magic link email template with your branding

### Add Your Clients:

1. Go to Authentication → Users
2. Click "Add User" → "Create New User"
3. Enter their email
4. Don't set a password (they'll use magic links)
5. Also add them to your `clients` table via SQL Editor:
   ```sql
   INSERT INTO clients (email, name) VALUES ('client@email.com', 'Client Name');
   ```

---

## Part 7: Deploy to Vercel (Go Live)

### Push to GitHub:

If using Claude Code, ask it: "Push this project to GitHub for me — create a new repository called [your-name]."

If doing it manually:
1. Go to github.com → Click "+" → "New repository"
2. Name it (e.g., "my-coaching-platform")
3. Keep it private
4. Don't add any files (no README, no .gitignore)
5. Follow the commands GitHub shows you (Claude can help)

### Deploy on Vercel:

1. Go to vercel.com
2. Click "Add New" → "Project"
3. Select your GitHub repository
4. Before clicking Deploy, add your environment variables:
   - Click "Environment Variables"
   - Add each one:
     - `NEXT_PUBLIC_SUPABASE_URL` = (from Part 1B)
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (from Part 1B)
     - `NEXT_PUBLIC_ADMIN_EMAIL` = (your email)
     - `NEXT_PUBLIC_SITE_URL` = (leave blank for now — you'll update after first deploy)
     - `ANTHROPIC_API_KEY` = (from Part 1D)
5. Click "Deploy"
6. Wait 2-3 minutes
7. Vercel will give you a URL (e.g., my-coaching-platform.vercel.app)
8. Copy this URL

**Now update two things:**
1. Go back to Vercel → Settings → Environment Variables
   - Update `NEXT_PUBLIC_SITE_URL` to your new Vercel URL
2. Go to Supabase → Authentication → URL Configuration
   - Set "Site URL" to your Vercel URL
   - Add `https://your-vercel-url.vercel.app/auth/callback` to Redirect URLs
3. Redeploy on Vercel (go to Deployments → click the three dots on the latest → Redeploy)

### Test It:

1. Go to your Vercel URL
2. You should see the login page
3. Enter YOUR email (the admin one)
4. Check your email for the magic link
5. Click it — you should land on the admin dashboard
6. Try with a client email — they should land on the client dashboard

---

## Part 8: Ongoing Changes and Maintenance

### To make changes:

Open Claude Code in your project folder and tell it what you want. Examples:

- "Add a new playbook called [name] with 4 stages: [describe each stage]"
- "Change the colour from gold to blue"
- "Add a field to the morning check-in for tracking sleep hours"
- "Show me the revenue graph for the last 6 months on the admin dashboard"

After making changes, deploy:
```
git add . && git commit -m "description of change" && git push
```

Vercel will automatically redeploy when you push to GitHub.

### If something breaks:

1. Go to Vercel → Deployments → click the latest one
2. Check "Build Logs" for errors
3. Copy the error and paste it to Claude
4. Claude will fix it
5. Push again

### To add a new client:

1. Supabase → Authentication → Users → Add User (their email)
2. Run in SQL Editor:
   ```sql
   INSERT INTO clients (email, name) VALUES ('new@email.com', 'Their Name');
   ```
3. Tell them to go to your app URL and enter their email to get a magic link

---

## Common Questions

**How much will this cost to run?**
- Supabase: Free for up to 50,000 rows and 500MB storage
- Vercel: Free for personal projects
- Claude API: ~£5-20/month depending on how many AI generations your clients do
- Total: roughly £5-20/month

**Can I use my own domain?**
Yes. In Vercel, go to Settings → Domains → Add your custom domain. Follow the DNS instructions.

**What if I want features The Motherboard has?**
Ask Claude to build them. Describe what you want in plain English. The more specific you are, the better the result.

**Can my clients see each other's data?**
No. Row Level Security (RLS) on Supabase ensures each client only sees their own data. The admin (you) can see everyone's data.

**What if Supabase or Vercel go down?**
This is extremely rare (99.9%+ uptime). If it happens, your data is safe — it's just temporarily unavailable. Wait 30 minutes and try again.

**Can I charge my clients for access?**
Yes. You could add a Stripe integration for payments, or simply manage access manually by adding/removing users in Supabase.

---

## Quick Reference Card

| What | Where |
|------|-------|
| Your app | your-app.vercel.app |
| Database | supabase.com → your project |
| Hosting | vercel.com → your project |
| AI API | console.anthropic.com |
| Code | github.com → your repo |
| Make changes | Claude Code or claude.ai |
| Deploy changes | `git push` (auto-deploys) |
| Add clients | Supabase → Auth → Users |
| Check errors | Vercel → Deployments → Logs |
