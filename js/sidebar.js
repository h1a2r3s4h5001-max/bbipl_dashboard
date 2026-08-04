/* ==========================================================
   BBIPL Dashboard
   sidebar.js
========================================================== */

/* Sidebar active state management */

document.addEventListener("DOMContentLoaded", () => {

    /* Highlight active menu item based on current page */

    const currentPage = window.location.pathname.split("/").pop() || "index.html";

    const menuLinks = document.querySelectorAll(".sidebar ul li a");

    menuLinks.forEach(link => {

        const href = link.getAttribute("href");

        if (href === currentPage) {

            link.closest("li").classList.add("active");

        }

    });

});
