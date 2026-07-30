 /* ==========================================================
   BBIPL Central Management System
   settings.js
========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("settingsForm");
    if (!form) return;

    const siteNameInput = document.getElementById("siteName");
    const siteTaglineInput = document.getElementById("siteTagline");
    const emailInput = document.getElementById("email");
    const seoTitleInput = document.getElementById("seoTitle");
    const seoDescInput = document.getElementById("seoDesc");

    const darkMode = document.getElementById("darkMode");
    const notifications = document.getElementById("notifications");

    const saveBtn = document.getElementById("saveSettings");
    const resetBtn = document.getElementById("resetSettings");

    /* Notification Settings Elements */
    const emailNotifs = document.getElementById("emailNotifs");
    const browserNotifs = document.getElementById("browserNotifs");
    const soundNotifs = document.getElementById("soundNotifs");
    const pageNotifs = document.getElementById("pageNotifs");
    const blogNotifs = document.getElementById("blogNotifs");
    const userNotifs = document.getElementById("userNotifs");
    const systemNotifs = document.getElementById("systemNotifs");
    const addDemoNotifBtn = document.getElementById("addDemoNotifBtn");
    const clearAllNotifsBtn = document.getElementById("clearAllNotifsBtn");

    /* =====================================
       Load Settings
    ===================================== */

    function loadSettings() {
        const site = JSON.parse(localStorage.getItem("cmsSite"));
        if (site) {
            if (siteNameInput) siteNameInput.value = site.name || "BBIPL CMS";
            if (siteTaglineInput) siteTaglineInput.value = site.tagline || "";
            if (seoTitleInput) seoTitleInput.value = site.seoTitle || "";
            if (seoDescInput) seoDescInput.value = site.seoDescription || "";
        }
        const user = JSON.parse(localStorage.getItem("cmsUser"));
        if (user && emailInput) {
            emailInput.value = user.email || "admin@bbipl.com";
        }
        darkMode.checked = localStorage.getItem("theme") === "dark";
        notifications.checked = localStorage.getItem("notifications") !== "off";
    }

    function loadNotificationSettings() {
        const notifSettings = window.NotificationManager
            ? NotificationManager.getSettings()
            : {
                emailNotifications: true,
                browserNotifications: false,
                soundEnabled: true,
                showPageNotifs: true,
                showBlogNotifs: true,
                showUserNotifs: true,
                showSystemNotifs: true
              };
        if (emailNotifs) emailNotifs.checked = notifSettings.emailNotifications !== false;
        if (browserNotifs) browserNotifs.checked = notifSettings.browserNotifications === true;
        if (soundNotifs) soundNotifs.checked = notifSettings.soundEnabled !== false;
        if (pageNotifs) pageNotifs.checked = notifSettings.showPageNotifs !== false;
        if (blogNotifs) blogNotifs.checked = notifSettings.showBlogNotifs !== false;
        if (userNotifs) userNotifs.checked = notifSettings.showUserNotifs !== false;
        if (systemNotifs) systemNotifs.checked = notifSettings.showSystemNotifs !== false;
    }

    loadSettings();
    loadNotificationSettings();

    /* =====================================
       Save Settings
    ===================================== */

    saveBtn.addEventListener("click", function(e){
        e.preventDefault();

        const site = {
            name: siteNameInput ? siteNameInput.value.trim() : "BBIPL CMS",
            tagline: siteTaglineInput ? siteTaglineInput.value.trim() : "",
            logo: "images/logo.png",
            seoTitle: seoTitleInput ? seoTitleInput.value.trim() : "BBIPL CMS",
            seoDescription: seoDescInput ? seoDescInput.value.trim() : "",
            currency: "INR",
            timezone: "Asia/Kolkata"
        };
        localStorage.setItem("cmsSite", JSON.stringify(site));

        const user = JSON.parse(localStorage.getItem("cmsUser")) || {};
        if (emailInput) user.email = emailInput.value.trim();
        localStorage.setItem("cmsUser", JSON.stringify(user));

        if(darkMode.checked){
            localStorage.setItem("theme","dark");
            document.body.classList.add("dark");
        } else {
            localStorage.setItem("theme","light");
            document.body.classList.remove("dark");
        }
        localStorage.setItem("notifications", notifications.checked ? "on" : "off");

        /* Save Notification Settings */
        if (window.NotificationManager) {
            NotificationManager.saveSettings({
                emailNotifications: emailNotifs ? emailNotifs.checked : true,
                browserNotifications: browserNotifs ? browserNotifs.checked : false,
                soundEnabled: soundNotifs ? soundNotifs.checked : true,
                showPageNotifs: pageNotifs ? pageNotifs.checked : true,
                showBlogNotifs: blogNotifs ? blogNotifs.checked : true,
                showUserNotifs: userNotifs ? userNotifs.checked : true,
                showSystemNotifs: systemNotifs ? systemNotifs.checked : true
            });
        }

        if(window.showToast){
            showToast("Settings Saved Successfully");
        } else {
            alert("Settings Saved Successfully");
        }
    });

    /* =====================================
       Reset
    ===================================== */

    resetBtn.addEventListener("click",function(){
        if(!confirm("Reset all settings?")) return;
        localStorage.removeItem("theme");
        localStorage.removeItem("notifications");
        localStorage.removeItem("cmsSite");
        localStorage.removeItem("cmsUser");
        localStorage.removeItem("cmsNotificationSettings");
        location.reload();
    });

    /* =====================================
       Live Theme
    ===================================== */

    darkMode.addEventListener("change",function(){
        document.body.classList.toggle("dark", this.checked);
    });

/* =====================================
       Demo Notification Button
    ===================================== */

    if (addDemoNotifBtn) {
        addDemoNotifBtn.addEventListener("click", function() {
            if (window.NotificationManager) {
                NotificationManager.addDemoNotification();
                if (window.showToast) showToast("Demo notification added!");
            } else {
                alert("Notification system not yet loaded. Please wait a moment.");
            }
        });
    }

    /* =====================================
       Clear All Notifications Button
    ===================================== */

    if (clearAllNotifsBtn) {
        clearAllNotifsBtn.addEventListener("click", function() {
            if (confirm("Clear all notifications? This cannot be undone.")) {
                if (window.NotificationManager) {
                    NotificationManager.clearAll();
                    if (window.showToast) showToast("All notifications cleared");
                }
            }
        });
    }

    /* =====================================
       SMTP / Email Configuration (Gmail)
    ===================================== */

    const smtpEnabled = document.getElementById("smtpEnabled");
    const smtpFields = document.getElementById("smtpFields");
    const smtpGmailEmail = document.getElementById("smtpGmailEmail");
    const smtpAppPassword = document.getElementById("smtpAppPassword");
    const smtpFromName = document.getElementById("smtpFromName");
    const testSmtpBtn = document.getElementById("testSmtpBtn");
    const checkSmtpStatusBtn = document.getElementById("checkSmtpStatusBtn");
    const smtpStatus = document.getElementById("smtpStatus");
    const toggleAppPassword = document.getElementById("toggleAppPassword");

    // Toggle App Password visibility
    if (toggleAppPassword) {
        toggleAppPassword.addEventListener("click", function() {
            if (smtpAppPassword) {
                if (smtpAppPassword.type === "password") {
                    smtpAppPassword.type = "text";
                    toggleAppPassword.classList.remove("fa-eye");
                    toggleAppPassword.classList.add("fa-eye-slash");
                } else {
                    smtpAppPassword.type = "password";
                    toggleAppPassword.classList.remove("fa-eye-slash");
                    toggleAppPassword.classList.add("fa-eye");
                }
            }
        });
    }

    // Load SMTP settings
    function loadSmtpSettings() {
        if (!window.EmailService) return;
        const settings = EmailService.getSmtpSettings();
        if (smtpEnabled) smtpEnabled.checked = settings.enabled === true;
        if (smtpGmailEmail) smtpGmailEmail.value = settings.gmailEmail || "";
        if (smtpAppPassword) smtpAppPassword.value = settings.gmailAppPassword || "";
        if (smtpFromName) smtpFromName.value = settings.fromName || "BBIPL CMS";
        if (smtpFields) smtpFields.style.display = smtpEnabled && smtpEnabled.checked ? "block" : "none";
        if (smtpStatus) smtpStatus.style.display = "none";
    }

    // Toggle SMTP fields visibility
    if (smtpEnabled) {
        smtpEnabled.addEventListener("change", function() {
            if (smtpFields) {
                smtpFields.style.display = this.checked ? "block" : "none";
            }
        });
    }

    // Save SMTP settings when main form saves
    saveBtn.addEventListener("click", function(e) {
        // SMTP settings are saved separately
        if (window.EmailService && smtpEnabled) {
            const settings = {
                gmailEmail: smtpGmailEmail ? smtpGmailEmail.value : "",
                gmailAppPassword: smtpAppPassword ? smtpAppPassword.value : "",
                fromName: smtpFromName ? smtpFromName.value : "BBIPL CMS",
                enabled: smtpEnabled.checked,
                testMode: !smtpEnabled.checked || !smtpGmailEmail.value || !smtpAppPassword.value
            };
            EmailService.saveSmtpSettings(settings);
        }
    });

    // Send test email
    if (testSmtpBtn) {
        testSmtpBtn.addEventListener("click", async function() {
            if (!window.EmailService) {
                if (smtpStatus) {
                    smtpStatus.style.display = "block";
                    smtpStatus.style.background = "#fef2f2";
                    smtpStatus.style.color = "#ef4444";
                    smtpStatus.textContent = "❌ Email service not loaded. Please refresh the page.";
                }
                return;
            }

            // Validate fields
            const email = smtpGmailEmail ? smtpGmailEmail.value.trim() : "";
            const password = smtpAppPassword ? smtpAppPassword.value.trim() : "";
            
            if (!email) {
                if (smtpStatus) {
                    smtpStatus.style.display = "block";
                    smtpStatus.style.background = "#fef2f2";
                    smtpStatus.style.color = "#ef4444";
                    smtpStatus.textContent = "❌ Please enter your Gmail email address.";
                }
                return;
            }
            
            if (!password) {
                if (smtpStatus) {
                    smtpStatus.style.display = "block";
                    smtpStatus.style.background = "#fef2f2";
                    smtpStatus.style.color = "#ef4444";
                    smtpStatus.textContent = "❌ Please enter your Gmail App Password.";
                }
                return;
            }

            // Save current settings first
            const settings = {
                gmailEmail: email,
                gmailAppPassword: password,
                fromName: smtpFromName ? smtpFromName.value : "BBIPL CMS",
                enabled: true,
                testMode: false
            };
            EmailService.saveSmtpSettings(settings);

            // Show status
            if (smtpStatus) {
                smtpStatus.style.display = "block";
                smtpStatus.style.background = "#eff6ff";
                smtpStatus.style.color = "#2563eb";
                smtpStatus.textContent = "⏳ Sending test email...";
            }

            testSmtpBtn.disabled = true;
            testSmtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            // Send test email to the configured Gmail address
            const result = await EmailService.sendTestEmail(email);

            testSmtpBtn.disabled = false;
            testSmtpBtn.innerHTML = '<i class="fa-solid fa-vial"></i> Send Test Email';

            if (smtpStatus) {
                smtpStatus.style.display = "block";
                if (result.success) {
                    smtpStatus.style.background = result.demo ? "#fefce8" : "#f0fdf4";
                    smtpStatus.style.color = result.demo ? "#a16207" : "#16a34a";
                    smtpStatus.textContent = result.demo 
                        ? "⚠️ Demo mode: SMTP server not running. Run the server with: cd server && node server.js"
                        : `✅ Test email sent to ${email}! Check your inbox.`;
                } else {
                    smtpStatus.style.background = "#fef2f2";
                    smtpStatus.style.color = "#ef4444";
                    smtpStatus.textContent = "❌ Failed: " + (result.message || "Unknown error");
                }
            }
        });
    }

    // Check server status
    if (checkSmtpStatusBtn) {
        checkSmtpStatusBtn.addEventListener("click", async function() {
            if (smtpStatus) {
                smtpStatus.style.display = "block";
                smtpStatus.style.background = "#eff6ff";
                smtpStatus.style.color = "#2563eb";
                smtpStatus.textContent = "⏳ Checking SMTP server status...";
            }

            checkSmtpStatusBtn.disabled = true;
            checkSmtpStatusBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';

            try {
                const response = await fetch("http://localhost:3001/api/status");
                const data = await response.json();
                
                if (smtpStatus) {
                    smtpStatus.style.display = "block";
                    if (data.configured) {
                        smtpStatus.style.background = "#f0fdf4";
                        smtpStatus.style.color = "#16a34a";
                        smtpStatus.textContent = `✅ ${data.message}`;
                    } else {
                        smtpStatus.style.background = "#fefce8";
                        smtpStatus.style.color = "#a16207";
                        smtpStatus.textContent = `⚠️ ${data.message}`;
                    }
                }
            } catch (e) {
                if (smtpStatus) {
                    smtpStatus.style.display = "block";
                    smtpStatus.style.background = "#fef2f2";
                    smtpStatus.style.color = "#ef4444";
                    smtpStatus.textContent = "❌ SMTP server is offline. Start it with: cd server && node server.js";
                }
            }

            checkSmtpStatusBtn.disabled = false;
            checkSmtpStatusBtn.innerHTML = '<i class="fa-solid fa-server"></i> Check Server Status';
        });
    }

    // Load SMTP settings on init
    loadSmtpSettings();
});
