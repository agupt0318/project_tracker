# throwaway lab

A personal tracker for building momentum without portfolio pressure.

## stack

- **Frontend**: React + Vite
- **Database**: Supabase (Postgres)
- **Hosting**: Vercel (free tier → `your-name.vercel.app`)

---

## deploy in ~10 minutes

### 1. Supabase setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Name it anything (e.g. `throwaway-lab`)
3. Go to **Database → SQL Editor → New query**
4. Paste the contents of `supabase_schema.sql` and click **Run**
5. Go to **Settings → API** and copy:
   - **Project URL** → this is your `VITE_SUPABASE_URL`
   - **anon public** key → this is your `VITE_SUPABASE_ANON_KEY`

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "init throwaway lab"
gh repo create throwaway-lab --private --push --source=.
# or push to an existing repo
```

### 3. Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
4. Click **Deploy**

You'll get a URL like `throwaway-lab.vercel.app` immediately.

### Optional: custom domain

In Vercel → your project → **Settings → Domains**, add any domain you own.
Namecheap/Cloudflare domains work great. Or keep the free `.vercel.app` subdomain.

---

## local dev

```bash
cp .env.example .env.local
# fill in your Supabase values

npm install
npm run dev
```

---

## what it tracks

- **Daily check-ins**: 3 questions, any "yes" counts
- **Experiments**: freeform log of anything you poked at
- **2-week challenge**: 14-day grid showing active days
- **Analytics**: 30-day heatmap, weekly bar chart, day-of-week patterns, streak stats
- **Rules**: the 14-day contract

---

## the contract

You are banned from building portfolio projects for 14 days.
You are only allowed to build throwaway experiments.
Nothing public. Nothing resume-worthy.
Just proofs of motion.
