# 🚀 BBIPL CMS - Hosting Guide

This guide explains how to deploy the **BBIPL Central Management System** as a
single production server (frontend + API together on one port).

The server (`server/server.js`) has been updated to:

- Serve the **static frontend** (`index.html`, `css/`, `js/`, `images/`) from the same port.
- Read the port from `process.env.PORT` (with fallback to `3001`).
- Keep all `/api/*` routes (OTP email, notifications) intact.
- Support direct navigation to `/settings.html`, `/users.html`, etc.

---

## 1. Prerequisites

- **Node.js 18+** installed locally (for testing) or on your VPS.
- A **Gmail account** with an **App Password** for sending OTP emails.
  - Create one here: https://myaccount.google.com/apppasswords
  - (Requires 2-Step Verification enabled on the Google account.)

---

## 2. Run Locally (testing)

```bash
# From the project root:
cd server
npm install          # installs express, cors, nodemailer
node server.js       # starts on http://localhost:3001
```

Open http://localhost:3001 — the app will be served there.

> ⚠️ On Windows you can also double-click `server/start.bat`.

---

## 3. Configure Gmail (for real OTP emails)

1. Open the app → **Settings** page.
2. Enable **"Enable SMTP Email Service"**.
3. Enter your **Gmail address** and **App Password** (16-character code, not your
   normal password).
4. Click **"Send Test Email"** to verify. You should receive an email.

> The credentials are stored in `server/smtp-config.json`. For production
> security, set these environment variables instead:
>
> - `GMAIL_EMAIL` — your Gmail address
> - `GMAIL_APP_PASSWORD` — your Gmail App Password

---

## 4. Deploy Options

### Option A — Render (free, recommended for quick start)

1. Push this project to a GitHub repository.
2. Go to [render.com](https://render.com) → **New** → **Web Service**.
3. Connect your repository (the project includes a root `package.json`, so
   Render builds from the repo root automatically — leave **Root Directory** empty).
4. Set these values:
   - **Name**: `bbipl-cms`
   - **Root Directory**: *(leave empty)*
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Under **Environment**, add:
   - `PORT = 10000` (Render provides this automatically)
   - `GMAIL_EMAIL` = your Gmail address
   - `GMAIL_APP_PASSWORD` = your App Password
6. Click **Create Web Service**. Render will give you a URL like
   `https://bbipl-cms.onrender.com`.

> ⚠️ The free tier sleeps after 15 minutes of inactivity. The first request
> after sleep can take ~1 minute to wake up. Upgrade for always-on.

### Option B — Railway

1. Push this project to GitHub.
2. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**.
3. Railway auto-detects the Node app (root `package.json`). Start command: `npm start`.
4. Add variables: `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD`.
5. Railway assigns a public URL automatically (e.g. `https://bbipl-cms.up.railway.app`).

### Option C — VPS / Dedicated Server (full control)

Requires a server with a public IP (Hostinger, DigitalOcean, AWS EC2, etc.).

```bash
# 1. Install Node.js 18+ and Git
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. Clone your project
git clone https://github.com/YOUR_USERNAME/bbipl-cms.git /var/www/bbipl-cms
cd /var/www/bbipl-cms/server
npm install --production

# 3. Create a systemd service
sudo nano /etc/systemd/system/bbipl-cms.service
```

```ini
[Unit]
Description=BBIPL CMS Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/bbipl-cms/server
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=3000
Environment=GMAIL_EMAIL=you@gmail.com
Environment=GMAIL_APP_PASSWORD=your-app-password

[Install]
WantedBy=multi-user.target
```

```bash
# 4. Start and enable the service
sudo systemctl daemon-reload
sudo systemctl enable --now bbipl-cms
sudo systemctl status bbipl-cms

# 5. (Optional) Reverse proxy with Nginx + HTTPS
sudo nano /etc/nginx/sites-available/bbipl-cms
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bbipl-cms /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Then add HTTPS with [Certbot](https://certbot.eff.org) for a free SSL certificate.

---

## 5. After Deploying

- Open your live URL — the **login page** will be shown.
- Log in with OTP. To receive **real OTP emails**, go to **Settings → SMTP** and
  enter your Gmail credentials (or set the `GMAIL_EMAIL` / `GMAIL_APP_PASSWORD`
  env vars on the host).
- If SMTP is not configured, the app falls back to **demo mode** (OTP is shown in
  the browser console) so you can still test the UI.

---

## 6. Environment Variables Summary

| Variable            | Required | Description                                    |
|---------------------|----------|------------------------------------------------|
| `PORT`              | No       | Port the server listens on (default `3001`). Platforms set this automatically. |
| `GMAIL_EMAIL`       | No       | Gmail address used to send OTP emails.          |
| `GMAIL_APP_PASSWORD`| No       | Gmail App Password (16 chars).                  |

---

## 7. Important Notes

- The app uses `localStorage` for user/site data (client-side). For a
  multi-user production system, connect a real database (MongoDB/PostgreSQL)
  and add server-side auth.
- `server/smtp-config.json` contains Gmail credentials **in plain text** — never
  commit it. Use env vars in production (already supported).
- Notifications are stored in `server/notifications.json` on the server's disk.
  On free-tier hosts with ephemeral storage, this resets on redeploy.
</content>

