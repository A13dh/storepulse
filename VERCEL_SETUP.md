# Vercel Environment Variables Setup

## Database Connection Fixed ✅

Your Railway PostgreSQL database is now accessible via the proxy endpoint:
- **Host:** `gondola.proxy.rlwy.net`
- **Port:** `10049`
- **Database:** `railway`
- **Username:** `postgres`

## Add These Variables to Vercel

Go to: **https://vercel.com** → Select **storepulse** project → Settings → Environment Variables

Add the following variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | `postgresql://postgres:VVwUbFIaxlTvuJxTYJJbQZsawnsQVOcm@gondola.proxy.rlwy.net:10049/railway?sslmode=allow` |
| `JWT_SECRET` | `92JEeOCc2VSZqgbq0I/XrJ8KMHkQbRenbFnji1RVS6s=` |
| `NEXTAUTH_SECRET` | `8931e66eb62fb231a42482a72982d95c` |
| `NEXT_PUBLIC_APP_URL` | `https://storepulse-two.vercel.app` |

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
