# 🚀 Production Deployment Guide

## Free Hosting Stack (100% Free Forever)

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Frontend | **Vercel** | Unlimited sites, 100GB bandwidth |
| Backend | **Render** | 750 hours/month, auto-deploy |
| Database | **Neon** | 512MB PostgreSQL, serverless |
| Domain | *.vercel.app / *.onrender.com | Free subdomains |

**Total Monthly Cost: $0**

---

## Step 1: Set Up Database (Neon - Free Forever)

1. Go to [neon.tech](https://neon.tech) → Sign up free (GitHub login works)
2. Create new project → Name: `csv-copilot`
3. Copy connection string from dashboard:
   ```
   postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

---

## Step 2: Deploy Backend (Render - Free Forever)

### Option A: One-Click Deploy (Recommended)

1. Push code to GitHub:
   ```bash
   cd /Users/krkaushikkumar/Desktop/csv
   git init
   git add .
   git commit -m "Initial commit"
   gh repo create csv-copilot --public --push
   ```

2. Go to [render.com](https://render.com) → Sign up free
3. Click **New → Web Service**
4. Connect your GitHub repo
5. Configure:
   - **Root Directory**: `apps/api`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port $PORT`

6. Add Environment Variables:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | (paste Neon connection string) |
   | `JWT_SECRET_KEY` | (click "Generate" for random value) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` |

7. Click **Create Web Service**

Your API will be live at: `https://csv-copilot-api.onrender.com`

---

## Step 3: Deploy Frontend (Vercel - Free Forever)

1. Go to [vercel.com](https://vercel.com) → Sign up free
2. Click **Add New → Project**
3. Import your GitHub repo
4. Configure:
   - **Root Directory**: `apps/web`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variable:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://csv-copilot-api.onrender.com` |

6. Click **Deploy**

Your app will be live at: `https://csv-copilot.vercel.app`

---

## Step 4: Update CORS (Important!)

After frontend deploys, update the `FRONTEND_URL` in Render:
1. Go to Render dashboard → Your service → Environment
2. Set `FRONTEND_URL` to your Vercel URL (e.g., `https://csv-copilot.vercel.app`)
3. Click Save → Service will redeploy

---

## Step 5: Seed Demo Users (Optional)

In Render dashboard → Your service → Shell:
```bash
python scripts/seed_demo_user.py
```

---

## Verify Deployment

```bash
# Check API health
curl https://csv-copilot-api.onrender.com/health

# Expected:
# {"status":"ok","version":"0.3.0","database":"connected"}
```

---

## Environment Variables Summary

### Backend (Render)

| Variable | Example | Required |
|----------|---------|----------|
| `DATABASE_URL` | `postgresql://...@neon.tech/...` | ✅ |
| `JWT_SECRET_KEY` | Generate random 64 chars | ✅ |
| `FRONTEND_URL` | `https://your-app.vercel.app` | ✅ |

### Frontend (Vercel)

| Variable | Example | Required |
|----------|---------|----------|
| `VITE_API_URL` | `https://your-api.onrender.com` | ✅ |

---

## ⚠️ Render Free Tier Notes

- **Cold starts**: App sleeps after 15min inactivity, ~15-30 sec to wake up
- **Workaround**: Use [UptimeRobot](https://uptimerobot.com) (free) to ping your `/health` endpoint every 14 minutes
- **750 hours/month**: Plenty for one always-on service

---

## Free Monitoring

| Service | Use For | Free Tier |
|---------|---------|-----------|
| [UptimeRobot](https://uptimerobot.com) | Uptime + keep alive | 50 monitors |
| [Sentry](https://sentry.io) | Error tracking | 5K errors/month |
| [Vercel Analytics](https://vercel.com/analytics) | Frontend metrics | Built-in free |

---

## Custom Domain (Optional, ~$10/year)

1. Buy domain from Namecheap/Porkbun (~$10/year for .com)
2. In Vercel: Settings → Domains → Add
3. In Render: Settings → Custom Domain → Add
4. Update DNS as instructed

---

## Quick Deploy Checklist

- [ ] Create Neon account + database
- [ ] Push code to GitHub
- [ ] Create Render web service with env vars
- [ ] Create Vercel project with env vars
- [ ] Update FRONTEND_URL in Render after Vercel deploys
- [ ] Set up UptimeRobot to prevent cold starts
- [ ] Test login with demo@example.com / demo123
