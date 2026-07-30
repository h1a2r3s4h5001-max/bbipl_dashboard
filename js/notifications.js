/* ==========================================================
   BBIPL Central Management System
   notifications.js - Server-Backed Notification Manager
   Syncs with SMTP server for persistent notifications
========================================================== */

"use strict";

/**
 * NotificationManager - Handles all notification operations
 * Stores notifications on the SMTP server with localStorage fallback
 * Each notification: { id, type, title, message, icon, color, time, read, dismissed }
 */
const NotificationManager = {

    STORAGE_KEY: "cmsNotifications",
    SETTINGS_KEY: "cmsNotificationSettings",
    SMTP_SERVER_URL: "http://localhost:3001",

    /* ==========================================
       INIT
    ========================================== */

    init() {
        this.ensureDefaults();
        this.renderAll();
        this.bindEvents();
        this.startPeriodicCheck();
        this.syncFromServer();
    },

    /* ==========================================
       SERVER SYNC
    ========================================== */

    async syncFromServer() {
        try {
            const resp = await fetch(this.SMTP_SERVER_URL + "/api/notifications/list");
            if (resp.ok) {
                const data = await resp.json();
                if (data.success && data.notifications && data.notifications.length > 0) {
                    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data.notifications));
                    this.renderAll();
                }
            }
        } catch (e) {
            // Server offline - use localStorage as fallback
            console.log("[NOTIF] Server offline, using localStorage");
        }
    },

    async syncToServer(type, title, message, notifyAdmin) {
        try {
            const payload = {
                type: type || "system",
                title: title,
                message: message,
                notifyAdmin: notifyAdmin === true
            };
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (e) {
            // Server offline - notification stored locally
            console.log("[NOTIF] Server offline, notification stored locally");
        }
    },

    async serverMarkRead(id) {
        try {
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/mark-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
        } catch (e) { /* silent fail */ }
    },

    async serverMarkAllRead() {
        try {
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/mark-all-read", {
                method: "POST",
                headers: { "Content-Type": "application/json" }
            });
        } catch (e) { /* silent fail */ }
    },

    async serverDismiss(id) {
        try {
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/dismiss", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id })
            });
        } catch (e) { /* silent fail */ }
    },

    async serverClearAll() {
        try {
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/clear", {
                method: "DELETE"
            });
        } catch (e) { /* silent fail */ }
    },

    async fetchServerSettings() {
        try {
            const resp = await fetch(this.SMTP_SERVER_URL + "/api/notifications/settings");
            if (resp.ok) {
                const data = await resp.json();
                if (data.success && data.settings) {
                    localStorage.setItem(this.SETTINGS_KEY + "_server", JSON.stringify(data.settings));
                    return data.settings;
                }
            }
        } catch (e) { /* silent fail */ }
        return null;
    },

    async saveServerSettings(settings) {
        try {
            await fetch(this.SMTP_SERVER_URL + "/api/notifications/settings", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
        } catch (e) { /* silent fail */ }
    },

    /* ==========================================
       ENSURE DEFAULT NOTIFICATIONS
    ========================================== */

    ensureDefaults() {
        const existing = this.getAll();
        if (existing.length === 0) {
            const defaults = [
                {
                    id: "notif_1",
                    type: "page",
                    title: "New page published",
                    message: "A new page \"About Us\" has been created.",
                    icon: "fa-solid fa-file-lines",
                    color: "blue",
                    time: Date.now() - 2 * 60 * 1000,
                    read: false,
                    dismissed: false
                },
                {
                    id: "notif_2",
                    type: "blog",
                    title: "Blog post scheduled",
                    message: "\"Company Update\" is scheduled for tomorrow.",
                    icon: "fa-solid fa-newspaper",
                    color: "green",
                    time: Date.now() - 15 * 60 * 1000,
                    read: false,
                    dismissed: false
                },
                {
                    id: "notif_3",
                    type: "user",
                    title: "New user registered",
                    message: "John Doe has created an account.",
                    icon: "fa-solid fa-user-plus",
                    color: "orange",
                    time: Date.now() - 60 * 60 * 1000,
                    read: false,
                    dismissed: false
                },
                {
                    id: "notif_4",
                    type: "system",
                    title: "System update available",
                    message: "Version 2.1.0 is ready to install.",
                    icon: "fa-solid fa-exclamation-triangle",
                    color: "red",
                    time: Date.now() - 24 * 60 * 60 * 1000,
                    read: true,
                    dismissed: false
                }
            ];
            this.saveAll(defaults);
        }
    },

    /* ==========================================
       CRUD OPERATIONS
    ========================================== */

    getAll() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error("Error reading notifications:", e);
            return [];
        }
    },

    saveAll(notifications) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notifications));
    },

    getUnread() {
        return this.getAll().filter(n => !n.read && !n.dismissed);
    },

    getUnreadCount() {
        return this.getUnread().length;
    },

    getActive() {
        return this.getAll().filter(n => !n.dismissed);
    },

    markAsRead(id) {
        const notifications = this.getAll();
        const idx = notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
            notifications[idx].read = true;
            this.saveAll(notifications);
            this.renderAll();
            this.serverMarkRead(id);
            return true;
        }
        return false;
    },

    markAllAsRead() {
        const notifications = this.getAll();
        notifications.forEach(n => { n.read = true; });
        this.saveAll(notifications);
        this.renderAll();
        this.serverMarkAllRead();
        if (window.showToast) showToast("All notifications marked as read");
    },

    dismiss(id) {
        const notifications = this.getAll();
        const idx = notifications.findIndex(n => n.id === id);
        if (idx !== -1) {
            notifications[idx].dismissed = true;
            this.saveAll(notifications);
            this.renderAll();
            this.serverDismiss(id);
            return true;
        }
        return false;
    },

    addNotification(notif) {
        const notifications = this.getAll();
        notif.id = notif.id || "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        notif.time = notif.time || Date.now();
        notif.read = false;
        notif.dismissed = false;
        notifications.unshift(notif);
        this.saveAll(notifications);
        this.renderAll();
        // Sync to server (without email notification by default)
        this.syncToServer(notif.type, notif.title, notif.message, false);
        return notif;
    },

    /**
     * Create a notification AND send email to admin
     * Used for important events like page creation, media upload
     */
    async addNotificationWithEmail(type, title, message) {
        const notif = {
            type: type || "system",
            title: title,
            message: message,
            time: Date.now(),
            read: false,
            dismissed: false
        };
        const notifications = this.getAll();
        notif.id = "notif_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        notifications.unshift(notif);
        this.saveAll(notifications);
        this.renderAll();
        // Sync to server with email notification to admin
        await this.syncToServer(type, title, message, true);
        return notif;
    },

    addSystemNotification(title, message, type = "info") {
        const iconMap = {
            info: "fa-solid fa-circle-info",
            success: "fa-solid fa-circle-check",
            warning: "fa-solid fa-triangle-exclamation",
            error: "fa-solid fa-circle-xmark"
        };
        const colorMap = {
            info: "blue",
            success: "green",
            warning: "orange",
            error: "red"
        };
        return this.addNotification({
            type: "system",
            title: title,
            message: message,
            icon: iconMap[type] || iconMap.info,
            color: colorMap[type] || colorMap.info
        });
    },

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
        this.ensureDefaults();
        this.renderAll();
        this.serverClearAll();
    },

    /* ==========================================
       RENDER NOTIFICATIONS IN PANEL
    ========================================== */

    renderNotifications() {
        const container = document.getElementById("notificationBody");
        if (!container) return;

        const notifications = this.getActive();

        if (notifications.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:var(--text-light);">
                    <i class="fa-solid fa-bell-slash" style="font-size:48px;margin-bottom:15px;opacity:0.3;"></i>
                    <p>No notifications yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = notifications.map(n => {
            const timeAgo = this.getTimeAgo(n.time);
            const unreadClass = !n.read ? " unread" : "";
            return `
                <div class="notification-item${unreadClass}" data-id="${n.id}">
                    <div class="notif-icon ${n.color}"><i class="${n.icon}"></i></div>
                    <div class="notif-content">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <small>${timeAgo}</small>
                    </div>
                    <button class="notif-dismiss" data-id="${n.id}" title="Dismiss">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        }).join("");
    },

    renderMessages() {
        const container = document.getElementById("messagesBody");
        if (!container) return;

        const messages = this.getActive().filter(n => n.type === "message");

        if (messages.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:40px 20px;color:var(--text-light);">
                    <i class="fa-solid fa-envelope-open" style="font-size:48px;margin-bottom:15px;opacity:0.3;"></i>
                    <p>No messages yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map(n => {
            const timeAgo = this.getTimeAgo(n.time);
            const unreadClass = !n.read ? " unread" : "";
            return `
                <div class="notification-item${unreadClass}" data-id="${n.id}">
                    <div class="notif-icon ${n.color}"><i class="fa-solid fa-user"></i></div>
                    <div class="notif-content">
                        <h4>${n.title}</h4>
                        <p>${n.message}</p>
                        <small>${timeAgo}</small>
                    </div>
                    <button class="notif-dismiss" data-id="${n.id}" title="Dismiss">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            `;
        }).join("");
    },

    /* ==========================================
       UPDATE BADGE
    ========================================== */

    updateBadge() {
        const count = this.getUnreadCount();
        const badges = document.querySelectorAll(".badge");

        badges.forEach(badge => {
            badge.textContent = count;
            if (count === 0) {
                badge.style.display = "none";
            } else {
                badge.style.display = "flex";
            }
        });
    },

    /* ==========================================
       RENDER ALL
    ========================================== */

    renderAll() {
        this.renderNotifications();
        this.renderMessages();
        this.updateBadge();
    },

    /* ==========================================
       TIME AGO HELPER
    ========================================== */

    getTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 10) return "Just now";
        if (seconds < 60) return seconds + " seconds ago";
        if (minutes === 1) return "1 minute ago";
        if (minutes < 60) return minutes + " minutes ago";
        if (hours === 1) return "1 hour ago";
        if (hours < 24) return hours + " hours ago";
        if (days === 1) return "Yesterday";
        if (days < 7) return days + " days ago";
        return new Date(timestamp).toLocaleDateString();
    },

    /* ==========================================
       BIND EVENTS
    ========================================== */

    bindEvents() {
        // Click on notification content to mark as read
        document.addEventListener("click", (e) => {
            const content = e.target.closest(".notif-content");
            if (content) {
                const item = content.closest(".notification-item");
                if (item) {
                    const id = item.dataset.id;
                    if (id) this.markAsRead(id);
                }
            }
        });

        // Dismiss button
        document.addEventListener("click", (e) => {
            const dismissBtn = e.target.closest(".notif-dismiss");
            if (dismissBtn) {
                e.stopPropagation();
                const id = dismissBtn.dataset.id;
                if (id) {
                    const item = dismissBtn.closest(".notification-item");
                    if (item) {
                        item.style.transition = "all .3s ease";
                        item.style.transform = "translateX(100px)";
                        item.style.opacity = "0";
                        setTimeout(() => {
                            this.dismiss(id);
                        }, 300);
                    }
                }
            }
        });

        // Mark all read buttons
        document.addEventListener("click", (e) => {
            if (e.target.id === "markAllRead" || e.target.closest("#markAllRead")) {
                this.markAllAsRead();
            }
        });

        // Mark messages read
        document.addEventListener("click", (e) => {
            if (e.target.id === "markMessagesRead" || e.target.closest("#markMessagesRead")) {
                const container = document.getElementById("messagesBody");
                if (container) {
                    container.querySelectorAll(".notification-item.unread").forEach(item => {
                        item.classList.remove("unread");
                    });
                    if (window.showToast) showToast("All messages marked as read");
                }
            }
        });
    },

    /* ==========================================
       PERIODIC CHECK (every 30s sync from server)
    ========================================== */

    startPeriodicCheck() {
        setInterval(() => {
            this.renderAll();
            this.syncFromServer();
        }, 30000);
    },

    /* ==========================================
       SETTINGS
    ========================================== */

    getSettings() {
        try {
            // Try server settings first
            const serverData = localStorage.getItem(this.SETTINGS_KEY + "_server");
            if (serverData) return JSON.parse(serverData);
        } catch (e) { /* ignore */ }

        try {
            const data = localStorage.getItem(this.SETTINGS_KEY);
            return data ? JSON.parse(data) : {
                emailNotifications: true,
                browserNotifications: false,
                soundEnabled: true,
                showPageNotifs: true,
                showBlogNotifs: true,
                showMediaNotifs: true,
                showUserNotifs: true,
                showSystemNotifs: true,
                notifyAdminOnUpload: true,
                notifyAdminOnPageCreate: true
            };
        } catch (e) {
            return {};
        }
    },

    saveSettings(settings) {
        localStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
        // Also sync to server
        this.saveServerSettings(settings);
    },

    /* ==========================================
       DEMO - Add sample notification
    ========================================== */

    addDemoNotification() {
        const types = [
            { type: "page", title: "New page created", message: "A new page \"Services\" has been published.", icon: "fa-solid fa-file-lines", color: "blue" },
            { type: "blog", title: "Blog post published", message: "\"10 Tips for Better Management\" is now live.", icon: "fa-solid fa-newspaper", color: "green" },
            { type: "media", title: "Media uploaded", message: "3 new files have been uploaded to Media Library.", icon: "fa-solid fa-images", color: "orange" },
            { type: "user", title: "New user registered", message: "Sarah Johnson has created an account.", icon: "fa-solid fa-user-plus", color: "orange" },
            { type: "system", title: "Backup completed", message: "Daily backup completed successfully.", icon: "fa-solid fa-circle-check", color: "green" },
            { type: "system", title: "Storage warning", message: "Storage is at 85% capacity. Please clean up.", icon: "fa-solid fa-triangle-exclamation", color: "red" }
        ];
        const random = types[Math.floor(Math.random() * types.length)];
        this.addNotification(random);
        if (window.showToast) showToast("New notification: " + random.title);
    }
};

/* ==========================================
   INITIALIZE ON DOM READY
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        NotificationManager.init();
        window.NotificationManager = NotificationManager;
    }, 200);
});
