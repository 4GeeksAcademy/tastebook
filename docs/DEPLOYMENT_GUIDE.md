# 🚀 Complete Deployment Guide for TasteBook

## 📋 Overview
This guide covers **all deployment methods** for your React + Flask web application using the existing configurations in your codebase. We'll deploy to **Render.com** (recommended), with alternatives for Heroku and Docker.

## 🔧 Prerequisites

### System Requirements
- ✅ Node.js version 20+ (check with `node --version`)
- ✅ Python 3.10+ (check with `python --version`)
- ✅ Git (check with `git --version`)
- ✅ PostgreSQL database (local or cloud)

### Accounts Needed
- 📧 [GitHub account](https://github.com) (for repository hosting)
- 🌐 [Render.com account](https://dashboard.render.com/register?next=/) (free tier available)
- 🐘 PostgreSQL database (Render provides free tier)

---

## 🏠 Local Development Setup

### 1. Clone and Install Dependencies
```bash
# Clone your repository
git clone https://github.com/your-username/tastebook.git
cd tastebook

# Install Python dependencies
pipenv install

# Install Node.js dependencies
npm install
```

### 2. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your settings
nano .env
```

**Required Environment Variables:**
```bash
# Database Configuration
DATABASE_URL=postgres://username:password@localhost:5432/tastebook

# Flask Configuration
FLASK_APP_KEY="your-secret-key-here"
FLASK_APP=src/app.py
FLASK_DEBUG=1

# Frontend Configuration
VITE_BASENAME=/
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Database Setup
```bash
# Initialize database migrations (if not exists)
pipenv run init

# Create new migrations
pipenv run migrate

# Apply migrations
pipenv run upgrade
```

### 4. Test Locally
```bash
# Start backend (in terminal 1)
pipenv run start

# Start frontend (in terminal 2)
npm run dev
```

Visit `http://localhost:3000` to test your application! 🎉

---

## 🚀 Deployment to Render.com (Recommended)

### Step 1: Prepare Your Repository
```bash
# Ensure all changes are committed
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Create Render Account
1. Go to [Render.com](https://dashboard.render.com/register?next=/)
2. Sign up using GitHub (recommended)
3. Verify your email

### Step 3: Create Blueprint
1. Click "New" → "Blueprint"
2. Connect your GitHub repository
3. Select your `tastebook` repository
4. Click "Connect"

### Step 4: Configure Blueprint
- **Service Group Name:** `tastebook-app`
- **Branch:** `main` (or your default branch)
- **Click "Apply"**

### Step 5: Wait for Deployment
⏳ This takes 5-10 minutes. You'll see:
- ✅ PostgreSQL database creation
- ✅ Web service build and deployment

### Step 6: Configure Environment Variables
1. Go to your Render dashboard
2. Find your web service
3. Go to "Environment"
4. Add these variables:

```bash
# Required Variables
FLASK_APP_KEY=your-super-secret-key-here
FLASK_DEBUG=0
PYTHON_VERSION=3.10.6

# Optional: Add any custom variables from your .env
```

### Step 7: Access Your App
Once deployment completes:
- 🌐 Your app will be available at: `https://your-service-name.onrender.com`
- 📊 Database connection is automatic via `DATABASE_URL`

---

## 🔄 Alternative: Deploy to Heroku

### Using Procfile Configuration
```bash
# Install Heroku CLI
# macOS: brew install heroku/brew/heroku
# Ubuntu: curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create Heroku app
heroku create your-tastebook-app

# Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set FLASK_APP_KEY="your-secret-key"
heroku config:set FLASK_DEBUG=0

# Deploy
git push heroku main

# Run database migrations
heroku run pipenv run upgrade
```

---

## 🐳 Alternative: Docker Deployment

### Using Dockerfile.render
```dockerfile
# Build the image
docker build -f Dockerfile.render -t tastebook .

# Run locally for testing
docker run -p 3000:3000 tastebook

# For production deployment:
# Push to Docker Hub or your container registry
docker tag tastebook your-registry/tastebook:latest
docker push your-registry/tastebook:latest
```

---

## 🗄️ Database Management

### Local Database Commands
```bash
# Create migration
pipenv run migrate

# Apply migrations
pipenv run upgrade

# Undo migration
pipenv run downgrade

# Reset database (CAUTION: destroys data)
bash ./docs/assets/reset_migrations.bash
```

### Production Database
- Render automatically creates PostgreSQL database
- Connection string is set via `DATABASE_URL` environment variable
- No manual database setup required!

---

## 🔧 Build Process Details

### Frontend Build (Vite)
```bash
npm run build  # Creates optimized build in /dist
```

### Backend Build (Flask)
- Uses `gunicorn` for production WSGI server
- Command: `gunicorn wsgi --chdir ./src/`
- Release command: `pipenv run upgrade` (runs migrations)

### Build Scripts
- `render_build.sh`: Handles full build process
- `database.sh`: Manages database migrations

---

## 🌍 Environment Variables Reference

### Backend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@host:5432/db` |
| `FLASK_APP` | Main Flask application file | `src/app.py` |
| `FLASK_APP_KEY` | Secret key for sessions | `your-secret-key` |
| `FLASK_DEBUG` | Debug mode (0=off, 1=on) | `0` |

### Frontend Variables
| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BASENAME` | Base path for routing | `/` |
| `VITE_BACKEND_URL` | API base URL | `https://api.yourapp.com` |

---

## 🚨 Troubleshooting

### Common Issues

#### ❌ Build Fails
```bash
# Check build logs in Render dashboard
# Common fixes:
# 1. Ensure Python version is 3.10+
# 2. Check that all dependencies are in requirements.txt
# 3. Verify environment variables are set
```

#### ❌ Database Connection Issues
```bash
# For local development:
# 1. Ensure PostgreSQL is running
# 2. Check DATABASE_URL format
# 3. Run: pipenv run upgrade

# For production:
# 1. Check Render database status
# 2. Verify DATABASE_URL is set automatically
```

#### ❌ Static Files Not Loading
```bash
# Ensure frontend build completed:
npm run build

# Check that /dist folder exists with files
ls -la dist/
```

#### ❌ Port Issues
- Backend runs on port 3001 locally
- Frontend runs on port 3000 locally
- Production uses dynamic ports

### Logs and Debugging
```bash
# View Render logs
# Go to Render dashboard → Your service → Logs tab

# View local logs
pipenv run start  # Backend logs in terminal
npm run dev       # Frontend logs in terminal
```

---

## 📝 Post-Deployment Checklist

- [ ] ✅ App loads successfully
- [ ] ✅ Database connections work
- [ ] ✅ User authentication functions
- [ ] ✅ Static assets load (images, CSS, JS)
- [ ] ✅ API endpoints respond correctly
- [ ] ✅ Environment variables are set
- [ ] ✅ Domain/SSL certificate (if custom domain)

---

## 🔄 Updates and Redeployment

### For Code Changes
```bash
# Make your changes
git add .
git commit -m "Your changes"
git push origin main

# Render auto-deploys on push
# Or manually trigger deploy in Render dashboard
```

### For Environment Changes
1. Update variables in Render dashboard
2. **Important:** Trigger manual redeploy after env var changes
3. Environment variables only take effect on rebuild

---

## 🎯 Performance Optimization

### Render Free Tier Limits
- 750 hours/month
- Sleeps after 15 minutes of inactivity
- Wakes up automatically on next request

### Database Optimization
- Use connection pooling
- Optimize queries in `src/api/models.py`
- Consider database indexes for large tables

---

## 📞 Support and Resources

- 📚 [4Geeks Documentation](https://4geeks.com/docs/start/react-flask-template)
- 🎥 [Deployment Video Tutorial](https://www.loom.com/share/f37c6838b3f1496c95111e515e83dd9b)
- 🐛 [GitHub Issues](https://github.com/4GeeksAcademy/react-flask-hello/issues)
- 💬 [4Geeks Community](https://4geeksacademy.slack.com)

---

## 🚀 Quick Deploy Commands

```bash
# One-time setup
pipenv install && npm install
cp .env.example .env
pipenv run init && pipenv run migrate && pipenv run upgrade

# Development
pipenv run start & npm run dev

# Production build
npm run build
```

**Happy Deploying! 🎉 Your TasteBook app is ready to serve the world!**
