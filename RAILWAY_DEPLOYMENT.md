# 🚂 Railway Deployment Guide for Raptor

## 🎯 Quick Deploy (5 Minutes)

### **Prerequisites:**
- GitHub account
- Railway account (sign up at https://railway.app)

---

## **Step 1: Push Code to GitHub**

```bash
cd /Users/kartikey/Desktop/Raptor

# Initialize git if not done
git init
git add .
git commit -m "Ready for Railway deployment"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/raptor.git
git branch -M main
git push -u origin main
```

---

## **Step 2: Deploy to Railway**

### **Option A: Via Railway Dashboard (Easiest)**

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **your Raptor repository**
5. Railway will auto-detect the Dockerfile
6. Click **"Deploy"**

### **Option B: Via Railway CLI**

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Initialize project
railway init

# Deploy
railway up
```

---

## **Step 3: Configure Environment Variables**

In Railway dashboard:

1. Go to your project
2. Click **"Variables"** tab
3. Add these variables:

```bash
PORT=3000
NODE_ENV=production
USE_DOCKER=false
```

**Important:** `USE_DOCKER=false` tells Raptor to use native binaries!

---

## **Step 4: Verify Deployment**

### **Check Health:**
```bash
curl https://your-app.railway.app/api/v1/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "uptime": 123.45,
  "memory": {
    "heapUsed": "45MB",
    "healthy": true
  },
  "queue": {
    "currentScans": 0,
    "maxConcurrent": 2,
    "queueLength": 0,
    "healthy": true
  },
  "environment": {
    "useDocker": false,
    "nodeEnv": "production"
  }
}
```

### **Test Scan:**
```bash
curl -X POST https://your-app.railway.app/api/v1/scan/web \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

---

## **📊 Railway Plan Recommendations**

| Plan | RAM | Cost | Use Case |
|------|-----|------|----------|
| **Hobby** | 512MB-1GB | **$5/month** | **MVP (Recommended)** |
| Hobby+ | 1-2GB | $10/month | 100+ users/day |
| Pro | 2-4GB | $20/month | 500+ users/day |

**Start with $5/month Hobby plan** - Perfect for MVP!

---

## **🔧 Scaling Configuration**

### **Increase Concurrent Scans:**

Edit `src/helpers/scanQueue.js`:
```javascript
// Change from 2 to 3 concurrent scans (needs 1GB RAM)
export const scanQueue = new ScanQueue(3);
```

### **Adjust Rate Limits:**

Edit `src/helpers/rateLimiter.js`:
```javascript
// Change from 1 scan/minute to 2 scans/minute
export const scanRateLimiter = new RateLimiter(60000, 2);
```

Then redeploy:
```bash
git add .
git commit -m "Increase capacity"
git push
# Railway auto-deploys!
```

---

## **📈 Monitoring**

### **Railway Dashboard:**
- View logs in real-time
- Monitor RAM usage
- Check deployment status

### **Health Endpoint:**
```bash
# Check health every 30 seconds
watch -n 30 curl https://your-app.railway.app/api/v1/health
```

### **Queue Status:**
The health endpoint shows:
- **currentScans:** How many scans running now
- **queueLength:** How many waiting
- **totalProcessed:** Lifetime scan count

---

## **🚨 Troubleshooting**

### **1. "Binary not found" error:**
**Solution:** Make sure `USE_DOCKER=false` in Railway variables

### **2. "Out of memory" error:**
**Solution:** Upgrade to Hobby+ plan ($10/month for 1-2GB RAM)

### **3. Scans timing out:**
**Check:** Health endpoint - if `queueLength > 5`, increase concurrent scans

### **4. Rate limit issues:**
**Solution:** Adjust rate limiter in `src/helpers/rateLimiter.js`

---

## **🎯 Performance Expectations**

### **On $5/month plan (512MB RAM):**
- ✅ 2 concurrent scans
- ✅ ~60-120 scans/hour
- ✅ ~1000-2000 scans/day
- ✅ Perfect for 10-50 daily users

### **On $10/month plan (1GB RAM):**
- ✅ 3-4 concurrent scans
- ✅ ~120-200 scans/hour
- ✅ ~2000-4000 scans/day
- ✅ Perfect for 50-200 daily users

---

## **🔐 Security Best Practices**

### **1. Environment Variables:**
```bash
# Never commit these!
PORT=3000
NODE_ENV=production
# Add future secrets here (API keys, etc.)
```

### **2. Rate Limiting:**
Already implemented! (1 scan/minute per IP)

### **3. Health Checks:**
Railway will auto-restart if health check fails

---

## **💰 Cost Optimization**

### **Current Setup (Binary Approach):**
- **RAM Usage:** ~300-400MB
- **Plan Needed:** $5/month Hobby
- **Annual Cost:** **$60/year**

### **vs. Docker-in-Docker:**
- **RAM Usage:** ~600-800MB
- **Plan Needed:** $20/month Pro
- **Annual Cost:** $240/year

**You save $180/year with binaries!** 🎉

---

## **🚀 Next Steps**

1. ✅ Deploy to Railway (done!)
2. ✅ Test all endpoints
3. ✅ Monitor performance
4. 🎨 Build frontend
5. 📱 Connect frontend to Railway backend
6. 🚀 Ship to users!

---

## **📞 Support**

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Raptor Issues: GitHub Issues

---

## **🎉 You're Live!**

Your Raptor backend is now running on Railway at:
```
https://your-app.railway.app
```

**API Endpoints:**
- `GET /api/v1/health` - Health check
- `POST /api/v1/scan/github` - GitHub scan
- `POST /api/v1/scan/web` - Web scan
- `POST /api/v1/scan/full` - Combined scan

**Ready to build that frontend and ship! 🦅**

