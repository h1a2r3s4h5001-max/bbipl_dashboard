/* ==========================================================
   BBIPL Central Management System
   app.js
========================================================== */

"use strict";

/* ===========================================
   CMS APP
=========================================== */

const APP = {

    user: null,
    site: null,

    init() {

        this.loadSite();
        this.loadUser();
        this.checkAuthentication();
        this.updateUserInterface();
        this.initializeTheme();
        this.initializeLogout();

    },

    /* ===========================================
       SITE
    =========================================== */

    loadSite() {

        const stored = localStorage.getItem("cmsSite");

        if (stored) {

            this.site = JSON.parse(stored);

        } else {

            this.site = {
                name: "BBIPL CMS",
                tagline: "Content Management System",
                logo: "images/logo.png",
                seoTitle: "BBIPL CMS - Dashboard",
                seoDescription: "Central Content Management System",
                currency: "INR",
                timezone: "Asia/Kolkata"
            };

            localStorage.setItem(
                "cmsSite",
                JSON.stringify(this.site)
            );

        }

    },

    saveSite() {
        localStorage.setItem(
            "cmsSite",
            JSON.stringify(this.site)
        );
    },

    /* ===========================================
       USER
    =========================================== */

    loadUser() {

        const storedUser = localStorage.getItem("cmsUser");

        if (storedUser) {

            this.user = JSON.parse(storedUser);

        } else {

            this.user = {
                name: "Administrator",
                email: "admin@bbipl.com",
                role: "Administrator",
                image: "images/profile.png",
                bio: "Site Administrator"
            };

            localStorage.setItem(
                "cmsUser",
                JSON.stringify(this.user)
            );

        }

    },

    saveUser() {

        localStorage.setItem(
            "cmsUser",
            JSON.stringify(this.user)
        );

    },

    /* ===========================================
       AUTH
    =========================================== */

    checkAuthentication() {

        const currentPage = window.location.pathname
            .split("/")
            .pop();

        if (currentPage === "login.html")
            return;

        const loggedIn =
            localStorage.getItem("isLoggedIn");

        if (loggedIn !== "true") {

            window.location.href = "login.html";

        }

    },

    login(email, password) {

        if (
            email === "admin@example.com" &&
            password === "admin123"
        ) {

            localStorage.setItem(
                "isLoggedIn",
                "true"
            );

            window.location.href = "index.html";

            return true;

        }

        return false;

    },

    logout() {

        localStorage.removeItem("isLoggedIn");
        window.location.href = "login.html";

    },

    initializeLogout() {

        const logoutButton =
            document.getElementById("logoutBtn");

        if (!logoutButton) return;

        logoutButton.addEventListener(
            "click",
            () => { this.logout(); }
        );

    },

    /* ===========================================
       USER INTERFACE
    =========================================== */

    updateUserInterface() {

        if (!this.user) return;

        const usernameElements = document.querySelectorAll(
            "#username,#welcomeName,.user-name"
        );

        usernameElements.forEach(el => {
            el.textContent = this.user.name;
        });

        const emailElements = document.querySelectorAll(
            ".user-email"
        );

        emailElements.forEach(el => {
            el.textContent = this.user.email;
        });

        const profileImages =
            document.querySelectorAll(
                ".profile img,.profile-image"
            );

        profileImages.forEach(img => {
            img.src = this.user.image;
        });

    },

    /* ===========================================
       PROFILE
    =========================================== */

    updateProfile(data) {

        this.user = {
            ...this.user,
            ...data
        };

        this.saveUser();
        this.updateUserInterface();

    },

    /* ===========================================
       THEME
    =========================================== */

    initializeTheme() {

        const theme =
            localStorage.getItem("theme") || "light";

        if (theme === "dark") {
            document.body.classList.add("dark");
        }

    },

    toggleTheme() {

        document.body.classList.toggle("dark");

        const mode =
            document.body.classList.contains("dark")
                ? "dark"
                : "light";

        localStorage.setItem("theme", mode);

    },

    /* ===========================================
       STORAGE
    =========================================== */

    get(key) {
        return JSON.parse(localStorage.getItem(key));
    },

    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },

    remove(key) {
        localStorage.removeItem(key);
    }

};

/* ===========================================
   START APPLICATION
=========================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => { APP.init(); }
);

/* ===========================================
   GLOBAL ACCESS
=========================================== */

window.APP = APP;
