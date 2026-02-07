# StorePulse Deployment Guide

Complete guide for deploying StorePulse with Supabase, GitHub, and Netlify.

## 1. Supabase Setup

### Create Project
1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose organization, enter project name (e.g., "storepulse")
4. Set a strong database password (save it securely!)
5. Select region closest to your users

### Get Credentials
After project creation, go to **Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Database Connection
Go to **Settings → Database → Connection string (URI)**:
- Select **"Transaction"** mode for serverless (port 6543)
- Copy the connection string → `DATABASE_URL`
- Replace `[YOUR-PASSWORD]` with your database password

### Authentication Settings
Go to **Authentication → Providers**:
1. Enable **Email** provider
2. For testing: Disable "Confirm email" (enable for production)
3. Set redirect URLs:
   - `http://localhost:3000/**` (development)
   - `https://your-site.netlify.app/**` (production)

---

## 2. GitHub Setup

### Create Repository
```bash
# Navigate to project folder
cd "c:\Users\Aladi\Documents\Saas for tn shop"

# Verify git is initialized
git status

# Add all files
git add .

# Commit
git commit -m "Initial commit with Supabase + Netlify setup"

# Create repo on GitHub.com, then connect:
git remote add origin https://github.com/YOUR_USERNAME/storepulse.git

# Push
git branch -M main
git push -u origin main
```

### Important: Never commit these files
`.env`, `.env.local`, `.env.production.local` - these contain secrets!

---

## 3. Netlify Deployment

### Connect Repository
1. Go to [netlify.com](https://netlify.com) and sign in
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub account
4. Select the storepulse repository

### Configure Build Settings
Netlify should auto-detect from `netlify.toml`, but verify:
- **Build command**: `npm run build`
- **Publish directory**: `.next`

### Add Environment Variables
Go to **Site settings → Environment variables** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `DATABASE_URL` | Supabase pooler connection string |
| `FLOUCI_API_URL` | `https://developers.flouci.com/api` |
| `FLOUCI_APP_ID` | Your Flouci public key |
| `FLOUCI_APP_SECRET` | Your Flouci secret |
| `SENDGRID_API_KEY` | Your SendGrid API key |
| `AWS_ACCESS_KEY_ID` | Your AWS key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS secret |
| `AWS_BUCKET_NAME` | `storepulse-images` |
| `AWS_REGION` | `eu-west-3` |

### Deploy
Click "Deploy site" - Netlify will build and deploy automatically.

---

## 4. Common Deployment Error Fixes

### Blank Page After Deploy
**Cause**: Missing environment variables or client-side errors

**Fix**:
1. Check Netlify function logs for errors
2. Verify all `NEXT_PUBLIC_*` variables are set (they're exposed to client)
3. Open browser DevTools Console for JavaScript errors
4. Ensure Supabase project URL doesn't have trailing slash

### Build Fails: "Cannot find module '@prisma/client'"
**Cause**: Prisma client not generated during build

**Fix**: Ensure build command is `prisma generate && next build` (already configured in package.json)

### API Routes Return 500 Error
**Cause**: Database connection issues

**Fix**:
1. Verify `DATABASE_URL` uses **Transaction** pooler (port 6543), not Direct
2. Check Supabase dashboard for connection limits
3. Ensure password has no special characters that need URL encoding

### Authentication Not Working
**Cause**: Supabase redirect URL not configured

**Fix**:
1. Add your Netlify URL to Supabase **Authentication → URL Configuration → Redirect URLs**
2. Format: `https://your-site.netlify.app/**`

### "Invalid API Key" Errors
**Cause**: Environment variables not loading

**Fix**:
1. Redeploy after adding/changing environment variables
2. Verify no typos in variable names
3. Check variables in Netlify → Site settings → Environment variables

---

## 5. Run Database Migrations

After first deployment, run migrations against Supabase:

```bash
# Set DATABASE_URL to your Supabase connection string
# Use DIRECT connection (port 5432) for migrations, not pooler

npx prisma db push
```

This creates all tables defined in your Prisma schema.
