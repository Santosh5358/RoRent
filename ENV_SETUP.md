# Environment Setup Guide

## Overview
This project uses environment variables to configure sensitive data and deployment-specific settings.

## Files

### `.env.example`
- **Committed to Git** ✅ (safe to share)
- Template showing all available configuration options
- Reference for what variables are needed
- Instructions for each variable

### `.env`
- **NOT committed to Git** (in .gitignore)
- Contains your actual secrets and local configuration
- Copy from `.env.example` and fill in your real values

## Setup Instructions

### 1. **Create Local `.env` File**
```bash
# Copy the template
cp .env.example .env

# Then edit .env with your actual values
```

### 2. **Fill in Required Values**

#### MongoDB Atlas URI
Replace the placeholder with your actual cluster credentials:
```
MONGODB_URI=mongodb://YOUR_USERNAME:YOUR_PASSWORD@cluster0-shard-00-00.sg9bj.mongodb.net:27017,...
```

**How to get your URI:**
1. Go to MongoDB Atlas → Your Cluster → Connect
2. Choose "Drivers" → Java
3. Copy the connection string (starting with `mongodb://`)
4. Use the standard connection string (not `mongodb+srv://`)

#### JWT Secret
Generate a strong random secret:
```bash
# On macOS/Linux:
openssl rand -base64 32

# On Windows PowerShell:
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### 3. **Load Environment Variables**

#### Option A: IDE (VS Code / IntelliJ)
Create/edit launcher configuration to load `.env` before running:

**VS Code** - Add to `.vscode/launch.json`:
```json
{
  "configurations": [
    {
      "name": "Spring Boot",
      "type": "java",
      "args": "",
      "env": {
        "MONGODB_URI": "${env:MONGODB_URI}",
        "JWT_SECRET": "${env:JWT_SECRET}",
        "SERVER_PORT": "${env:SERVER_PORT}"
      }
    }
  ]
}
```

**IntelliJ IDEA** - Edit Run Configuration → Environment Variables → paste from `.env`

#### Option B: Command Line
Set environment variables before running:

**Windows PowerShell:**
```powershell
# Set temporary env vars for current session
$env:MONGODB_URI = "mongodb://..."
$env:JWT_SECRET = "your_secret"

# Then run backend
mvn spring-boot:run
```

**macOS/Linux:**
```bash
# Set env vars and run
MONGODB_URI="mongodb://..." \
JWT_SECRET="your_secret" \
mvn spring-boot:run
```

#### Option C: Cloud Deployment (Render/Railway)
1. **Do NOT commit `.env` to Git**
2. Go to your hosting platform dashboard
3. Set environment variables in the deployment/service settings
4. The app will read them automatically at runtime

Example for Render:
1. Dashboard → Your Service → Environment
2. Add variables: `MONGODB_URI`, `JWT_SECRET`, `SERVER_PORT`
3. Save and redeploy

### 4. **Verify Setup**

Check that the app can connect to MongoDB:
```bash
# Run backend
mvn spring-boot:run

# Look for log output like:
# "Spring Boot Started"
# "MongoDB connected successfully"
# "No MONGODB_URI environment variable set, using application.properties"
```

## Important Security Notes

⚠️ **NEVER commit `.env` to Git** - It contains passwords and secrets!

✅ **Always commit `.env.example`** - It shows the template without secrets

✅ **Rotate credentials regularly:**
- If credentials are exposed, change them immediately in MongoDB Atlas
- Generate new JWT_SECRET and redeploy

✅ **For Docker/Cloud:**
- Pass MONGODB_URI and JWT_SECRET as build/runtime environment variables
- Never hardcode credentials in Dockerfile or Docker Compose

## Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | ✅ Yes | — | MongoDB Atlas connection string |
| `MONGODB_DB` | No | `roomrent` | Database name |
| `JWT_SECRET` | ✅ Yes | — | Secret key for JWT token signing |
| `SERVER_PORT` | No | `8081` | HTTP server port |
| `LOGGER_LEVEL` | No | `INFO` | Logging level (TRACE, DEBUG, INFO, WARN, ERROR) |
| `APP_ENV` | No | `dev` | Environment (dev, staging, production) |

## Troubleshooting

### "Failed looking up TXT record" Error
- Use standard `mongodb://` connection string, not `mongodb+srv://`
- Connection string should have explicit replica-set members and ports

### "JWT_SECRET not set" Error
- Ensure `.env` file exists and is in the project root
- Verify the variable is loaded (check IDE launcher config)
- Try setting it manually: `$env:JWT_SECRET = "value"` (PowerShell)

### "Connection refused" Error
- Check MONGODB_URI is correct
- Verify MongoDB Atlas cluster is running and IP whitelist allows your IP
- Confirm network connectivity to cluster

---

**Questions?** Check `application.properties` for all available Spring Boot config options.
