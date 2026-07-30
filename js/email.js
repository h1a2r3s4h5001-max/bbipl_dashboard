/* ==========================================================
   BBIPL Central Management System
   email.js - SMTP Email Service (Local Node.js Server)
========================================================== */

"use strict";

/**
 * EmailService - Handles sending emails via local SMTP server
 * 
 * Uses a local Node.js server (server/server.js) as a proxy to 
 * send emails via Gmail SMTP with App Password.
 * 
 * Default: Uses a built-in demo service for testing.
 * Production: Start the server and configure Gmail credentials.
 */

const EmailService = {

    // Local SMTP Server URL
    SMTP_SERVER_URL: "http://localhost:3001",

    // SMTP Settings (stored in localStorage)
    SMTP_KEY: "cmsSmtpSettings",

    /* ==========================================
       INIT
    ========================================== */

    init() {
        // Check if server is reachable
        this.checkServerStatus();
    },

    /* ==========================================
       CHECK SERVER STATUS
    ========================================== */

    async checkServerStatus() {
        try {
            const response = await fetch(`${this.SMTP_SERVER_URL}/api/status`);
            if (response.ok) {
                const data = await response.json();
                if (data.configured) {
                    console.log(`%c[SMTP] Server connected - ${data.message}`, "color:#22c55e;font-weight:bold;");
                    this._serverConfigured = true;
                } else {
                    console.log(`%c[SMTP] Server online but ${data.message}`, "color:#f59e0b;font-weight:bold;");
                    this._serverConfigured = false;
                }
            }
        } catch (e) {
            console.log("%c[SMTP] Server offline - using demo mode", "color:#6366f1;font-weight:bold;");
            this._serverConfigured = false;
        }
    },

    /* ==========================================
       SMTP SETTINGS MANAGEMENT
    ========================================== */

    getSmtpSettings() {
        try {
            const data = localStorage.getItem(this.SMTP_KEY);
            if (data) return JSON.parse(data);
        } catch (e) {
            console.error("Error reading SMTP settings:", e);
        }
        // Default settings
        return {
            gmailEmail: "",
            gmailAppPassword: "",
            enabled: false,
            testMode: true // When true, shows OTP in console/toast instead of sending
        };
    },

    saveSmtpSettings(settings) {
        localStorage.setItem(this.SMTP_KEY, JSON.stringify(settings));
        // Notify the SMTP server of new config
        if (settings.enabled && settings.gmailEmail && settings.gmailAppPassword) {
            this.configureServer(settings.gmailEmail, settings.gmailAppPassword);
        }
    },

    /* ==========================================
       CONFIGURE LOCAL SMTP SERVER
    ========================================== */

    async configureServer(email, appPassword) {
        try {
            const response = await fetch(`${this.SMTP_SERVER_URL}/api/configure`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, appPassword })
            });
            const data = await response.json();
            if (data.success) {
                console.log("%c[SMTP] Server configured successfully", "color:#22c55e;font-weight:bold;");
            }
            return data;
        } catch (e) {
            console.warn("[SMTP] Could not reach server for configuration:", e.message);
            return { success: false, message: "Server offline: " + e.message };
        }
    },

    /* ==========================================
       SEND EMAIL VIA LOCAL SMTP SERVER
    ========================================== */

    /**
     * Send an email using the local SMTP server
     * @param {Object} params - Email parameters
     * @param {string} params.to - Recipient email
     * @param {string} params.subject - Email subject
     * @param {string} params.message - Email body (plain text)
     * @param {string} params.otp - OTP code
     * @returns {Promise<Object>} { success, message }
     */
    async sendEmail(params) {
        const settings = this.getSmtpSettings();

        // Check if SMTP server is reachable and configured
        // If the server is configured (has Gmail creds), use it even if localStorage says demo
        if (!this._serverConfigured) {
            // Try to check server status dynamically
            try {
                const resp = await fetch(`${this.SMTP_SERVER_URL}/api/status`);
                const statusData = await resp.json();
                this._serverConfigured = statusData.configured === true;
            } catch (e) {
                this._serverConfigured = false;
            }
        }

        // If server is configured on backend, send real email regardless of localStorage settings
        if (this._serverConfigured) {
            try {
                const response = await fetch(`${this.SMTP_SERVER_URL}/api/send-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: params.to,
                        otp: params.otp
                    })
                });

                const data = await response.json();

                if (data.success) {
                    console.log(`%c[SMTP] ✅ OTP sent successfully to ${params.to}`, "color:#22c55e;font-weight:bold;");
                    if (window.showToast) {
                        showToast(`✅ OTP sent to ${params.to}`, "success");
                    }
                    return { success: true, message: `OTP sent to ${params.to}` };
                } else if (data.setupRequired) {
                    console.warn("[SMTP] Server needs configuration");
                    return this.sendDemoEmail(params, "SMTP server not configured");
                } else {
                    throw new Error(data.message || "Unknown error");
                }
            } catch (error) {
                console.error("[SMTP] Failed to send:", error.message);
                return this.sendDemoEmail(params, error.message);
            }
        }

        // Fallback: use localStorage settings
        if (settings.testMode || !settings.enabled) {
            return this.sendDemoEmail(params);
        }

        try {
            const response = await fetch(`${this.SMTP_SERVER_URL}/api/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: params.to,
                    otp: params.otp
                })
            });

            const data = await response.json();

            if (data.success) {
                console.log(`%c[SMTP] OTP sent successfully to ${params.to}`, "color:#22c55e;font-weight:bold;");
                return { success: true, message: `OTP sent to ${params.to}` };
            } else if (data.setupRequired) {
                console.warn("[SMTP] Server needs configuration");
                return this.sendDemoEmail(params, "SMTP server not configured");
            } else {
                throw new Error(data.message || "Unknown error");
            }
        } catch (error) {
            console.error("[SMTP] Failed to send:", error.message);
            // Fallback to demo mode
            return this.sendDemoEmail(params, error.message);
        }
    },

    /* ==========================================
       DEMO EMAIL MODE (Fallback)
    ========================================== */

    sendDemoEmail(params) {
        const otp = params.otp || "N/A";
        const to = params.to || "user@example.com";

        console.log(
            `%c╔══════════════════════════════════════════╗\n` +
            `║         📧 DEMO EMAIL SERVICE           ║\n` +
            `╠══════════════════════════════════════════╣\n` +
            `║ To:      ${to.padEnd(35)}║\n` +
            `║ Subject: ${(params.subject || "Your OTP Code").padEnd(35)}║\n` +
            `║ OTP:     ${otp.padEnd(35)}║\n` +
            `╠══════════════════════════════════════════╣\n` +
            `║  ℹ️  Configure EmailJS in Settings for    ║\n` +
            `║  real SMTP email delivery.              ║\n` +
            `╚══════════════════════════════════════════╝`,
            "color:#4f46e5;font-weight:bold;font-size:12px;"
        );

// Show clean notification without exposing OTP value
        if (window.showToast) {
            showToast(`✅ OTP has been sent to ${to}`, "success");
        }

        return {
            success: true,
            message: `Email logged for ${to}`,
            demo: true,
            otp: otp
        };
    },

    /* ==========================================
       SEND OTP EMAIL
    ========================================== */

    async sendOTP(email, otp) {
        return this.sendEmail({
            to: email,
            toName: email.split("@")[0],
            subject: "Your OTP Code - BBIPL CMS Login",
            otp: otp,
            message: `Your OTP for login is: ${otp}\n\nThis code expires in 5 minutes.\n\nIf you didn't request this, please ignore this email.`
        });
    },

    /* ==========================================
       SEND TEST EMAIL
    ========================================== */

    async sendTestEmail(toEmail) {
        const testOtp = "123456";
        const result = await this.sendEmail({
            to: toEmail || "test@example.com",
            toName: "Test User",
            subject: "BBIPL CMS - SMTP Test Email",
            otp: testOtp,
            message: `This is a test email from BBIPL CMS.\n\nYour test OTP code is: ${testOtp}\n\nIf you received this, your SMTP configuration is working correctly!`
        });

        if (result.success) {
            if (window.showToast) {
                showToast(result.demo 
                    ? "📧 Demo mode: Test email logged to console" 
                    : "✅ Test email sent successfully!", 
                    result.demo ? "warning" : "success");
            }
        } else {
            if (window.showToast) {
                showToast("❌ Failed to send test email: " + result.message, "error");
            }
        }

        return result;
    },

    /* ==========================================
       CHECK CONFIGURATION STATUS
    ========================================== */

    isConfigured() {
        const settings = this.getSmtpSettings();
        return !!(settings.gmailEmail && settings.gmailAppPassword && settings.enabled);
    },

    getStatus() {
        const settings = this.getSmtpSettings();
        if (settings.testMode || !settings.enabled || !settings.gmailEmail) {
            return { 
                configured: false, 
                mode: "demo", 
                message: "Using demo mode (no real emails sent). Configure Gmail SMTP in Settings for production." 
            };
        }
        return {
            configured: true,
            mode: "gmail-smtp",
            message: `SMTP configured via Gmail (${settings.gmailEmail.replace(/(.{3})(.*)(?=@)/, "$1***")})`
        };
    }
};

/* ==========================================
   AUTO-INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        EmailService.init();
        window.EmailService = EmailService;
    }, 300);
});
