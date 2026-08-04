/* ==========================================================
   BBIPL CMS - SMTP Email Server + Notification System
   Handles sending OTP emails via Gmail SMTP (App Password)
   and server-backed notifications
   ========================================================== */

const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

// Port from environment (Render/Railway/VPS set this) with fallback to 3001
const PORT = process.env.PORT || 3001;

// Path to the project root (parent of the server/ directory) so we can serve
// the static frontend files (index.html, css/, js/, images/) from the same server.
const PROJECT_ROOT = path.join(__dirname, "..");

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==========================================================
// STATIC FRONTEND (served from the same server/port)
// ==========================================================
app.use(express.static(PROJECT_ROOT));

// SPA-style fallback: if the request is not an API call and does not match a
// static file, serve the matching .html file (or index.html). This lets
// direct navigation to /settings.html, /users.html, etc. work in production.
app.use("/", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
        return next();
    }
    const requestedPath = req.path.replace(/^\/+/, "") || "index.html";
    const candidates = [
        path.join(PROJECT_ROOT, requestedPath),
        path.join(PROJECT_ROOT, requestedPath + ".html"),
        path.join(PROJECT_ROOT, "index.html")
    ];
    for (const file of candidates) {
        if (fs.existsSync(file) && fs.statSync(file).isFile()) {
            return res.sendFile(file);
        }
    }
    return next();
});

// ==========================================================
// CONFIGURATION FILE
// ==========================================================

const CONFIG_PATH = path.join(__dirname, "smtp-config.json");

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("[SMTP] Error loading config:", e.message);
    }
    return null;
}

function saveConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
        return true;
    } catch (e) {
        console.error("[SMTP] Error saving config:", e.message);
        return false;
    }
}

// ==========================================================
// CREATE NODEMAILER TRANSPORTER
// ==========================================================

let transporter = null;

function createTransporter(config) {
    if (!config || !config.email || !config.appPassword) {
        console.log("[SMTP] Warning: SMTP not configured. Set GMAIL_EMAIL and GMAIL_APP_PASSWORD.");
        return null;
    }

    try {
        transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: config.email,
                pass: config.appPassword
            },
            tls: {
                rejectUnauthorized: false
            }
        });

        console.log(`[SMTP] Transporter created for ${config.email}`);
        return transporter;
    } catch (e) {
        console.error("[SMTP] Error creating transporter:", e.message);
        return null;
    }
}

// ==========================================================
// VERIFY TRANSPORTER CONNECTION
// ==========================================================

async function verifyTransporter() {
    if (!transporter) {
        const config = loadConfig();
        if (!config) return false;
        createTransporter(config);
    }

    if (!transporter) return false;

    try {
        await transporter.verify();
        console.log("[SMTP] Connection verified - ready to send emails");
        return true;
    } catch (e) {
        console.error("[SMTP] Connection verification failed:", e.message);
        return false;
    }
}

// ==========================================================
// NOTIFICATION SYSTEM (Server-Backed)
// ==========================================================

const NOTIFICATIONS_PATH = path.join(__dirname, "notifications.json");
const NOTIF_SETTINGS_PATH = path.join(__dirname, "notification-settings.json");

function loadNotifications() {
    try {
        if (fs.existsSync(NOTIFICATIONS_PATH)) {
            const data = fs.readFileSync(NOTIFICATIONS_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("[NOTIF] Error loading notifications:", e.message);
    }
    return [];
}

function saveNotifications(notifications) {
    try {
        fs.writeFileSync(NOTIFICATIONS_PATH, JSON.stringify(notifications, null, 2), "utf-8");
        return true;
    } catch (e) {
        console.error("[NOTIF] Error saving notifications:", e.message);
        return false;
    }
}

function loadNotifSettings() {
    try {
        if (fs.existsSync(NOTIF_SETTINGS_PATH)) {
            const data = fs.readFileSync(NOTIF_SETTINGS_PATH, "utf-8");
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("[NOTIF] Error loading notification settings:", e.message);
    }
    return null;
}

function saveNotifSettings(settings) {
    try {
        fs.writeFileSync(NOTIF_SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
        return true;
    } catch (e) {
        console.error("[NOTIF] Error saving notification settings:", e.message);
        return false;
    }
}

/**
 * POST /api/notifications/create
 * Create a new notification (can optionally send email to admin)
 */
app.post("/api/notifications/create", async (req, res) => {
    const { type, title, message, icon, color, notifyAdmin } = req.body;

    if (!title || !message) {
        return res.status(400).json({
            success: false,
            message: "Title and message are required"
        });
    }

const iconMap = {
        media: "fa-solid fa-images",
        user: "fa-solid fa-user-plus",
        system: "fa-solid fa-circle-info",
        message: "fa-solid fa-envelope"
    };

    const colorMap = {
        media: "orange",
        user: "orange",
        system: "red",
        message: "blue"
    };

    const notification = {
        id: "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
        type: type || "system",
        title: title,
        message: message,
        icon: icon || iconMap[type] || "fa-solid fa-circle-info",
        color: color || colorMap[type] || "blue",
        time: Date.now(),
        read: false,
        dismissed: false
    };

    const notifications = loadNotifications();
    notifications.unshift(notification);
    if (notifications.length > 100) notifications.length = 100;
    saveNotifications(notifications);

    if (notifyAdmin) {
        try {
            const config = loadConfig();
            if (config && config.email) {
                const mailTransporter = nodemailer.createTransport({
                    service: "gmail",
                    host: "smtp.gmail.com",
                    port: 587,
                    secure: false,
                    auth: { user: config.email, pass: config.appPassword },
                    tls: { rejectUnauthorized: false }
                });

                const emailHtml = `
                <div style="font-family:Poppins,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f9fafb;border-radius:16px;">
                    <div style="text-align:center;margin-bottom:20px;">
                        <h2 style="color:#4f46e5;margin:0;">BBIPL CMS Notification</h2>
                    </div>
                    <div style="background:#fff;padding:25px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
                        <p style="font-size:15px;color:#374151;line-height:1.7;"><strong>${title}</strong></p>
                        <p style="font-size:14px;color:#6b7280;line-height:1.6;">${message}</p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                        <p style="font-size:12px;color:#9ca3af;text-align:center;">BBIPL Central Management System</p>
                    </div>`;

                await mailTransporter.sendMail({
                    from: `"BBIPL CMS" <${config.email}>`,
                    to: config.email,
                    subject: title + " - BBIPL CMS",
                    html: emailHtml
                });
                console.log("[NOTIF] Email notification sent to admin: " + title);
            }
        } catch (e) {
            console.error("[NOTIF] Failed to send email notification:", e.message);
        }
    }

    console.log("[NOTIF] Notification created: " + title);
    return res.json({ success: true, message: "Notification created", notification });
});

/**
 * GET /api/notifications/list
 * Get all notifications
 */
app.get("/api/notifications/list", (req, res) => {
    const notifications = loadNotifications();
    return res.json({ success: true, notifications });
});

/**
 * POST /api/notifications/mark-read
 * Mark a single notification as read
 */
app.post("/api/notifications/mark-read", (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Notification ID is required" });
    const notifications = loadNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
        notifications[idx].read = true;
        saveNotifications(notifications);
        return res.json({ success: true });
    }
    return res.status(404).json({ success: false, message: "Not found" });
});

/**
 * POST /api/notifications/mark-all-read
 * Mark all as read
 */
app.post("/api/notifications/mark-all-read", (req, res) => {
    const notifications = loadNotifications();
    notifications.forEach(n => { n.read = true; });
    saveNotifications(notifications);
    return res.json({ success: true, message: "All marked read" });
});

/**
 * POST /api/notifications/dismiss
 * Dismiss a notification
 */
app.post("/api/notifications/dismiss", (req, res) => {
    const { id } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "ID is required" });
    const notifications = loadNotifications();
    const idx = notifications.findIndex(n => n.id === id);
    if (idx !== -1) {
        notifications[idx].dismissed = true;
        saveNotifications(notifications);
        return res.json({ success: true });
    }
    return res.status(404).json({ success: false, message: "Not found" });
});

/**
 * DELETE /api/notifications/clear
 * Clear all notifications
 */
app.delete("/api/notifications/clear", (req, res) => {
    saveNotifications([]);
    return res.json({ success: true, message: "All cleared" });
});

/**
 * GET /api/notifications/unread-count
 * Get unread count
 */
app.get("/api/notifications/unread-count", (req, res) => {
    const notifications = loadNotifications();
    const count = notifications.filter(n => !n.read && !n.dismissed).length;
    return res.json({ success: true, count });
});

/**
 * GET /api/notifications/settings
 * Get notification settings
 */
app.get("/api/notifications/settings", (req, res) => {
    let settings = loadNotifSettings();
    if (!settings) {
        settings = {
            emailNotifications: true,
            browserNotifications: false,
            soundEnabled: true,
            showMediaNotifs: true,
            showUserNotifs: true,
            showSystemNotifs: true,
            notifyAdminOnUpload: true
        };
        saveNotifSettings(settings);
    }
    return res.json({ success: true, settings });
});

/**
 * POST /api/notifications/settings
 * Save notification settings
 */
app.post("/api/notifications/settings", (req, res) => {
    const settings = req.body;
    if (!settings) return res.status(400).json({ success: false, message: "Settings required" });
    if (saveNotifSettings(settings)) {
        return res.json({ success: true, message: "Settings saved" });
    }
    return res.status(500).json({ success: false, message: "Failed to save" });
});

// ==========================================================
// API ROUTES
// ==========================================================

/**
 * POST /api/send-email
 * Send an email via Gmail SMTP
 */
app.post("/api/send-email", async (req, res) => {
    const { to, subject, text, html, otp } = req.body;

    if (!to) {
        return res.status(400).json({
            success: false,
            message: "Recipient email (to) is required"
        });
    }

    const isVerified = await verifyTransporter();
    if (!isVerified) {
        return res.status(500).json({
            success: false,
            message: "SMTP not configured. Please configure Gmail credentials first.",
            setupRequired: true
        });
    }

    try {
        const mailOptions = {
            from: `"BBIPL CMS" <${transporter.options.auth.user}>`,
            to: to,
            subject: subject || "Your OTP Code - BBIPL CMS",
            text: text || `Your OTP for login is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email.`,
            html: html || getOtpEmailTemplate(otp, to)
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`[SMTP] Email sent to ${to} - Message ID: ${info.messageId}`);

        return res.json({
            success: true,
            message: `Email sent successfully to ${to}`,
            messageId: info.messageId
        });

    } catch (error) {
        console.error("[SMTP] Failed to send email:", error.message);

        return res.status(500).json({
            success: false,
            message: `Failed to send email: ${error.message}`
        });
    }
});

/**
 * POST /api/send-otp
 * Send OTP email specifically for login
 */
app.post("/api/send-otp", async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({
            success: false,
            message: "Email and OTP are required"
        });
    }

    const htmlTemplate = getOtpEmailTemplate(otp, email);
    const textTemplate = `Your OTP for BBIPL CMS login is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email.`;

    const isVerified = await verifyTransporter();
    if (!isVerified) {
        return res.status(500).json({
            success: false,
            message: "SMTP not configured. Please configure Gmail credentials first.",
            setupRequired: true
        });
    }

    try {
        const mailOptions = {
            from: `"BBIPL CMS" <${transporter.options.auth.user}>`,
            to: email,
            subject: "Your OTP Code - BBIPL CMS Login",
            text: textTemplate,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`[SMTP] OTP sent to ${email} - Message ID: ${info.messageId}`);

        return res.json({
            success: true,
            message: `OTP sent successfully to ${email}`,
            messageId: info.messageId
        });

    } catch (error) {
        console.error("[SMTP] Failed to send OTP:", error.message);

        return res.status(500).json({
            success: false,
            message: `Failed to send OTP: ${error.message}`
        });
    }
});

/**
 * POST /api/test-email
 * Send a test email to verify SMTP configuration
 */
app.post("/api/test-email", async (req, res) => {
    const { to } = req.body;
    const testEmail = to || "test@example.com";

    const isVerified = await verifyTransporter();
    if (!isVerified) {
        return res.status(500).json({
            success: false,
            message: "SMTP not configured. Please configure Gmail credentials first.",
            setupRequired: true
        });
    }

    try {
        const mailOptions = {
            from: `"BBIPL CMS" <${transporter.options.auth.user}>`,
            to: testEmail,
            subject: "BBIPL CMS - SMTP Test Email",
            text: "This is a test email from BBIPL CMS.\n\nIf you received this, your SMTP configuration is working correctly!",
            html: `
                <div style="font-family:Poppins,sans-serif;max-width:600px;margin:0 auto;padding:30px;background:#f9fafb;border-radius:16px;">
                    <div style="text-align:center;margin-bottom:25px;">
                        <h2 style="color:#4f46e5;margin:0;">SMTP Configuration Successful</h2>
                    </div>
                    <div style="background:#fff;padding:25px;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);">
                        <p style="font-size:15px;color:#374151;line-height:1.7;">This is a test email from <strong>BBIPL CMS</strong>.</p>
                        <p style="font-size:15px;color:#374151;line-height:1.7;">If you received this, your SMTP configuration is working correctly!</p>
                        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0;">
                        <p style="font-size:13px;color:#9ca3af;text-align:center;">BBIPL Central Management System</p>
                    </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        return res.json({
            success: true,
            message: `Test email sent successfully to ${testEmail}`,
            messageId: info.messageId
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: `Failed to send test email: ${error.message}`
        });
    }
});

/**
 * POST /api/configure
 * Save SMTP configuration (Gmail App Password)
 */
app.post("/api/configure", async (req, res) => {
    const { email, appPassword } = req.body;

    if (!email || !appPassword) {
        return res.status(400).json({
            success: false,
            message: "Email and App Password are required"
        });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Please enter a valid email address"
        });
    }

    if (!email.toLowerCase().includes("gmail.com")) {
        return res.status(400).json({
            success: false,
            message: "Please use a Gmail address for SMTP configuration"
        });
    }

    const config = { email, appPassword };

    if (saveConfig(config)) {
        createTransporter(config);

        try {
            const testTransporter = nodemailer.createTransport({
                service: "gmail",
                host: "smtp.gmail.com",
                port: 587,
                secure: false,
                auth: { user: email, pass: appPassword },
                tls: { rejectUnauthorized: false }
            });
            await testTransporter.verify();
            transporter = testTransporter;

            return res.json({
                success: true,
                message: "SMTP configuration saved and verified successfully!"
            });
        } catch (verifyError) {
            return res.json({
                success: true,
                warning: true,
                message: "Configuration saved but verification failed: " + verifyError.message + ". Please check your credentials."
            });
        }
    } else {
        return res.status(500).json({
            success: false,
            message: "Failed to save configuration"
        });
    }
});

/**
 * GET /api/status
 * Get SMTP configuration status
 */
app.get("/api/status", (req, res) => {
    const config = loadConfig();

    if (config && config.email && config.appPassword) {
        return res.json({
            configured: true,
            email: config.email.replace(/(.{3})(.*)(?=@)/, "$1***"),
            message: `SMTP configured for ${config.email.replace(/(.{3})(.*)(?=@)/, "$1***")}`
        });
    }

    return res.json({
        configured: false,
        message: "SMTP not configured. Please set up Gmail App Password."
    });
});

// ==========================================================
// OTP EMAIL HTML TEMPLATE
// ==========================================================

function getOtpEmailTemplate(otp, email) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f3f4f6;font-family:Segoe UI,Tahoma,Geneva,Verdana,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:30px 0;">
            <tr>
                <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">

                        <!-- Header -->
                        <tr>
                            <td style="background:linear-gradient(135deg,#4f46e5,#6366f1);padding:35px 30px;text-align:center;">
                                <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">OTP Verification</h1>
                                <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:14px;">BBIPL Central Management System</p>
                            </td>
                        </tr>

                        <!-- Body -->
                        <tr>
                            <td style="padding:35px 30px;">
                                <p style="font-size:15px;color:#374151;margin:0 0 5px;">Hello,</p>
                                <p style="font-size:15px;color:#374151;margin:0 0 20px;line-height:1.6;">
                                    Use the following OTP to complete your login to <strong>BBIPL CMS</strong>:
                                </p>

                                <div style="background:#f0fdf4;border:2px dashed #22c55e;border-radius:12px;padding:20px;text-align:center;margin:20px 0;">
                                    <p style="font-size:13px;color:#16a34a;margin:0 0 10px;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Your One-Time Password</p>
                                    <div style="font-size:42px;font-weight:700;color:#4f46e5;letter-spacing:10px;font-family:Courier New,monospace;">${otp}</div>
                                    <p style="font-size:12px;color:#9ca3af;margin:12px 0 0;">This code expires in <strong style="color:#ef4444;">5 minutes</strong></p>
                                </div>

                                <div style="background:#fefce8;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:8px;margin:20px 0;">
                                    <p style="font-size:13px;color:#92400e;margin:0;line-height:1.5;">
                                        Never share this OTP with anyone. BBIPL will never ask for your OTP.
                                    </p>
                                </div>

                                <hr style="border:none;border-top:1px solid #e5e7eb;margin:25px 0;">

                                <p style="font-size:13px;color:#9ca3af;margin:0;line-height:1.6;">
                                    If you didn't request this login, please ignore this email.<br>
                                    Sent to: <strong style="color:#6b7280;">${email}</strong>
                                </p>
                            </td>
                        </tr>

                        <!-- Footer -->
                        <tr>
                            <td style="background:#f9fafb;padding:20px 30px;text-align:center;border-top:1px solid #e5e7eb;">
                                <p style="font-size:12px;color:#9ca3af;margin:0;">
                                    &copy; 2026 <strong>Big Box International Private Limited</strong><br>
                                    Central Management System v2.0
                                </p>
                            </td>
                        </tr>

                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
}

// ==========================================================
// START SERVER
// ==========================================================

const existingConfig = loadConfig();
if (existingConfig) {
    createTransporter(existingConfig);
    verifyTransporter();
}

app.listen(PORT, () => {
    console.log("");
    console.log("============================================");
    console.log("   BBIPL CMS - SMTP Email + Notification Server");
    console.log("============================================");
    console.log(`  Server running on http://localhost:${PORT}`);
    console.log(`  API: http://localhost:${PORT}/api`);
    console.log("============================================");

         const config = loadConfig();
    if (config && config.email) {
        console.log(`  SMTP configured for ${config.email}`);
    } else {
        console.log("  SMTP not configured.");
        console.log("  Configure via Settings page or POST /api/configure");
    }

    console.log("============================================");
    console.log("");
});
