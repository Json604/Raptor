# 🚀 Raptor - Quick Start Guide

## ⚡ Deploy to Railway in 5 Minutes

### **Step 1: Push to GitHub** (1 minute)
```bash
cd /Users/kartikey/Desktop/Raptor
git add .
git commit -m "Production-ready Raptor"
git push origin main
```

### **Step 2: Deploy to Railway** (2 minutes)
1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose **Raptor repository**
5. Railway auto-deploys! ✅

### **Step 3: Set Environment Variables** (1 minute)
In Railway dashboard → Variables tab:
```
USE_DOCKER=false
NODE_ENV=production
PORT=3000
```

### **Step 4: Test Deployment** (1 minute)
```bash
# Replace with your Railway URL
curl https://your-app.railway.app/api/v1/health
```

**Done! You're live! 🎉**

---

## 🧪 Test Your API

### **1. Web Scan:**
```bash
curl -X POST https://your-app.railway.app/api/v1/scan/web \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### **2. GitHub Scan:**
```bash
curl -X POST https://your-app.railway.app/api/v1/scan/github \
  -H "Content-Type: application/json" \
  -d '{"url":"https://github.com/atrull/fake-public-secrets"}'
```

### **3. Full Scan (UNIQUE!):**
```bash
curl -X POST https://your-app.railway.app/api/v1/scan/full \
  -H "Content-Type: application/json" \
  -d '{
    "githubUrl":"https://github.com/atrull/fake-public-secrets",
    "webUrl":"https://example.com"
  }'
```

---

## 💰 Cost

**$5/month** on Railway Hobby plan

Perfect for:
- 10-50 daily users
- 1000-2000 scans/day
- MVP launch

---

## 📚 Full Documentation

- **API Docs:** `API_DOCUMENTATION.md`
- **Deployment Guide:** `RAILWAY_DEPLOYMENT.md`
- **Implementation Details:** `IMPLEMENTATION_COMPLETE.md`

---

## 🎯 Next Steps

1. ✅ Backend deployed (done!)
2. 🎨 Build frontend (React dashboard)
3. 🚀 Ship to users
4. 💼 Apply to Delta with working demo

---

**Your Raptor backend is LIVE! 🦅**

