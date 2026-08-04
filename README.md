# BBIPL Central Management System (CMS)

A full-featured Content Management System for **Big Box International Private
Limited**. It includes an admin dashboard, OTP-based login with real Gmail SMTP
email delivery, user management, media management, site settings, and a
server-backed notification system.

---

## ✨ Features

- 🔐 **OTP-based login** — 6-digit one-time passwords sent via Gmail SMTP
  (with a built-in demo mode fallback when SMTP isn't configured).
- 📊 **Dashboard** — statistics cards, charts (Chart.js), calendar, recent
  activity, and quick links.
- 👥 **User Management** — add, edit, delete, and search users.
- 🖼️ **Media Management** — upload and organize media files.
- ⚙️ **Settings** — site name/tagline/SEO, dark mode, notification preferences,
  and Gmail SMTP configuration.
- 🔔 **Notifications** — server-backed notification panel with unread badges,
  mark-as-read, dismiss, and email alerts to the admin.
- 🎨 **Polish** — dark mode, page transitions, scroll-to-top, toasts, and a
  fully responsive sidebar layout.

---

## 🧱 Tech Stack

| Layer     | Technology                                    |
|-----------|-----------------------------------------------|
| Frontend  | HTML5, CSS3, Vanilla JavaScript, Chart.js     |
| Backend   | Node.js, Express                              |
| Email     | Nodemailer (Gmail SMTP with App Password)     |
| Data      | `localStorage` (client) + JSON files (server) |

---

## 📁 Project Structure

```
project/
├── index.html          # Dashboard page
├── login.html          # Login page (OTP + password)
├── users.html          # User management
├── settings.html       # Settings + SMTP config
├── media.html          # Media management
├── css/                # Stylesheets
├── js/                 # Frontend scripts
├── images/             # Logos & profile images
└── server/             # Node.js backend
    ├── server.js       # Express server + API + static hosting
    ├── package.json    # Backend dependencies
    └── start.bat       # Windows quick-start script
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- [Node.js](https://nodejs.org) 18 or newer
- A Gmail account with an **App Password** (for real email delivery)

### 1. Install backend dependencies

```bash
cd server
npm install
```

### 2. Start the server

```bash
node server.js
```

The whole app is served from **http://localhost:3001** — frontend *and* API.

> On Windows you can also double-click `server/start.bat`.

### 3. Log in

Open http://localhost:3001 — you'll land on the login page.

- **Password login:** `admin@example.com` / `admin123`
- **OTP login:** enter any email address. If SMTP is configured you'll receive
  a real OTP email; otherwise a demo OTP is printed to the browser console.

---

## ✉️ Setting Up Real OTP Emails (Gmail)

1. Enable [2-Step Verification](https://myaccount.google.com/security) on your
   Google account.
2. Create an **App Password**:
   https://myaccount.google.com/apppasswords
3. In the app, go to **Settings → SMTP Email Service**:
   - Enable the toggle.
   - Enter your **Gmail address** and the **16-character App Password**.
   - Click **Send Test Email** to verify.

> Production tip: set `GMAIL_EMAIL` and `GMAIL_APP_PASSWORD` as environment
> variables on your host instead of storing them in `smtp-config.json`.

---

## 🌐 Hosting / Deployment

The app is a **single Node.js server** that serves both the static frontend and
the API on one port, so it can be deployed to any Node.js host.

See **[HOSTING-GUIDE.md](./HOSTING-GUIDE.md)** for detailed, step-by-step
instructions for:

- **Render** (free web service)
- **Railway**
- **VPS / Dedicated server** (with Nginx + HTTPS)

### Quick deploy checklist

1. Push the project to GitHub.
2. Create a web service on Render/Railway (root directory: `server`).
3. Build: `npm install`, Start: `node server.js`.
4. Add env vars: `PORT`, `GMAIL_EMAIL`, `GMAIL_APP_PASSWORD`.
5. Open your live URL and log in.

---

## 🔑 Environment Variables

| Variable             | Required | Default | Description                                    |
|----------------------|----------|---------|------------------------------------------------|
| `PORT`               | No       | `3001`  | Port the server listens on.                    |
| `GMAIL_EMAIL`        | No       | —       | Gmail address used to send OTP emails.         |
| `GMAIL_APP_PASSWORD` | No       | —       | Gmail App Password (16 characters).            |

---

## 🔌 API Reference

| Method | Endpoint                              | Description                                |
|--------|---------------------------------------|--------------------------------------------|
| POST   | `/api/send-otp`                       | Send a login OTP email.                    |
| POST   | `/api/send-email`                     | Send a general email.                      |
| POST   | `/api/test-email`                     | Send a test email.                         |
| POST   | `/api/configure`                      | Save Gmail SMTP credentials.               |
| GET    | `/api/status`                         | SMTP configuration status.                 |
| GET    | `/api/notifications/list`             | List all notifications.                    |
| POST   | `/api/notifications/create`           | Create a notification.                     |
| POST   | `/api/notifications/mark-read`        | Mark a notification as read.               |
| POST   | `/api/notifications/mark-all-read`    | Mark all notifications as read.            |
| POST   | `/api/notifications/dismiss`          | Dismiss a notification.                    |
| DELETE | `/api/notifications/clear`            | Clear all notifications.                   |
| GET    | `/api/notifications/unread-count`     | Unread notification count.                 |
| GET/POST | `/api/notifications/settings`       | Get / save notification settings.          |

---

## 📝 License

© 2026 **Big Box International Private Limited**. All rights reserved.
</content>

