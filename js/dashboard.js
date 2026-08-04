/* ==========================================================
   BBIPL Central Management System
   dashboard.js
========================================================== */

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================
       SIDEBAR TOGGLE
    ========================== */

    const sidebar = document.querySelector(".sidebar");
    const menuBtn = document.getElementById("menuBtn");

    if (menuBtn && sidebar) {

        menuBtn.addEventListener("click", () => {

            sidebar.classList.toggle("active");
            sidebar.classList.toggle("collapsed");
            menuBtn.classList.toggle("active");

        });

    }

    /* ==========================
       NOTIFICATION PANEL & PROFILE DROPDOWN
    ========================== */

    const bellBtn = document.querySelector(".icon-btn:first-child");
    const notificationPanel = document.getElementById("notificationPanel");
    const envelopeBtn = document.querySelector(".icon-btn:last-child");
    const messagesPanel = document.getElementById("messagesPanel");
    const profileDropdown = document.getElementById("profileDropdown");
    const profile = document.querySelector(".profile");

    // Profile dropdown toggle
    if (profile && profileDropdown) {

        profile.addEventListener("click", (e) => {

            e.stopPropagation();
            // Close other panels
            if (notificationPanel) notificationPanel.classList.remove("show");
            if (messagesPanel) messagesPanel.classList.remove("show");
            profileDropdown.classList.toggle("show");

        });

    }

    // Bell button toggle
    if (bellBtn && notificationPanel) {

        bellBtn.addEventListener("click", (e) => {

            e.stopPropagation();
            e.preventDefault();

            const isOpen = notificationPanel.classList.contains("show");

            // Close all panels first
            if (notificationPanel) notificationPanel.classList.remove("show");
            if (messagesPanel) messagesPanel.classList.remove("show");
            if (profileDropdown) profileDropdown.classList.remove("show");

            // Toggle this panel
            if (!isOpen) notificationPanel.classList.add("show");

        });

    }

    // Envelope button toggle
    if (envelopeBtn && messagesPanel) {

        envelopeBtn.addEventListener("click", (e) => {

            e.stopPropagation();
            e.preventDefault();

            const isOpen = messagesPanel.classList.contains("show");

            // Close all panels first
            if (notificationPanel) notificationPanel.classList.remove("show");
            if (messagesPanel) messagesPanel.classList.remove("show");
            if (profileDropdown) profileDropdown.classList.remove("show");

            // Toggle this panel
            if (!isOpen) messagesPanel.classList.add("show");

        });

    }

    // Close panels on document click
    document.addEventListener("click", () => {

        if (notificationPanel) notificationPanel.classList.remove("show");
        if (messagesPanel) messagesPanel.classList.remove("show");
        if (profileDropdown) profileDropdown.classList.remove("show");

    });

    // Stop propagation on panel clicks so they don't close
    if (notificationPanel) {
        notificationPanel.addEventListener("click", (e) => e.stopPropagation());
    }
    if (messagesPanel) {
        messagesPanel.addEventListener("click", (e) => e.stopPropagation());
    }

    /* ==========================
       COUNTER ANIMATION
    ========================== */

    function animateCounter(id, endValue, duration = 1500) {

        const element = document.getElementById(id);

        if (!element) return;

        let start = 0;
        const increment = endValue / (duration / 16);

        function update() {

            start += increment;

            if (start >= endValue) {

                element.textContent = endValue.toLocaleString();

                return;

            }

            element.textContent = Math.floor(start).toLocaleString();

            requestAnimationFrame(update);

        }

        update();

    }

    // Get CMS stats from localStorage
    const users = JSON.parse(localStorage.getItem("cmsUsers") || "[]");

    animateCounter("userCount", users.length || 0);

    /* ==========================
       TOAST
    ========================== */

    const toast = document.getElementById("toast");

    function showToast(message, type = "success") {

        if (!toast) return;

        document.getElementById("toastMessage").textContent = message;

        // Remove existing type classes
        toast.classList.remove("toast-success", "toast-error");
        
        // Set background based on type
        if (type === "error") {
            toast.classList.add("toast-error");
            toast.style.background = "linear-gradient(135deg, #ef4444, #dc2626)";
            toast.style.boxShadow = "0 15px 35px rgba(239,68,68,.35)";
        } else {
            toast.classList.add("toast-success");
            toast.style.background = "linear-gradient(135deg, #22c55e, #16a34a)";
            toast.style.boxShadow = "0 15px 35px rgba(34,197,94,.35)";
        }

        toast.classList.add("show");

        setTimeout(() => {

            toast.classList.remove("show");

        }, 3000);

    }

    window.showToast = showToast;

    /* ==========================
       CONTENT CHART
    ========================== */

    const contentCanvas = document.getElementById("contentChart");

    if (contentCanvas) {

        new Chart(contentCanvas, {

            type: "line",

            data: {

                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],

                datasets: [{

                    label: "Media Uploaded",

                    data: [5, 8, 4, 12, 10, 15, 18],

                    borderColor: "#4f46e5",

                    backgroundColor: "rgba(79,70,229,.12)",

                    borderWidth: 3,

                    tension: .4,

                    fill: true

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: true

                    }

                }

            }

        });

    }

    /* ==========================
       CONTENT DISTRIBUTION CHART
    ========================== */

    const distCanvas = document.getElementById("distributionChart");

    if (distCanvas) {

        new Chart(distCanvas, {

            type: "doughnut",

            data: {

                labels: [

                    "Users"
                ],

                datasets: [{

                    data: [users.length],

                    backgroundColor: [

                        "#3b82f6"
                    ],

                    borderWidth: 2

                }]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        });

    }

    /* ==========================
       SCROLL EFFECT
    ========================== */

    window.addEventListener("scroll", () => {

        const navbar = document.querySelector(".navbar");

        if (!navbar) return;

        if (window.scrollY > 50) {

            navbar.classList.add("scrolled");

        } else {

            navbar.classList.remove("scrolled");

        }

    });

});
