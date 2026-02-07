# Vercel Environment Variables Setup

## Database Connection Fixed ✅

Your Supabase PostgreSQL database is accessible via the pooler:
- **Host:** `aws-1-eu-north-1.pooler.supabase.com`
- **Port:** `6543`
- **Database:** `postgres`
- **Username:** `postgres.torkptffaapvqaisoxrp`

## Add These Variables to Vercel

Go to: **https://vercel.com** → Select **storepulse** project → Settings → Environment Variables

Add the following variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | (Use your pooling URL from .env) |
| `DIRECT_URL` | (Use your direct URL from .env) |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://torkptffaapvqaisoxrp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (Your anon key from .env) |

## Important Notes

1. **Database migrations are already applied** — The Prisma schema has been synced with the Railway database
2. **SSL mode is set to `allow`** — Railway uses self-signed certificates on the proxy endpoint, so strict verification is disabled
3. **Pool configuration is optimized** — Connection timeouts and pool size are configured for Vercel serverless

## Next Steps

1. Add all variables to Vercel dashboard
2. Click "Save"
3. Trigger a new deployment: **Redeploy** from Deployments tab
4. Once deployed, test the signup endpoint: `POST /fr/api/auth/signup`
5. Monitor Vercel Logs for any errors

## Testing the Fix

Once deployed to Vercel, the `/api/auth/signup` and `/api/auth/login` endpoints should return:
- ✅ **201 Created** (signup successful)
- ✅ **200 OK** (login successful)
- ❌ **No more 500 errors**
