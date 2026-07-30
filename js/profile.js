/* ==========================================================
   BBIPL Dashboard
   profile.js
========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    const profileForm = document.getElementById("profileForm");

    if (!profileForm) return;

    const name = document.getElementById("name");
    const email = document.getElementById("email");
    const phone = document.getElementById("phone");
    const designation = document.getElementById("designation");
    const bio = document.getElementById("bio");

    const profileImage = document.getElementById("profileImage");
    const imageUpload = document.getElementById("imageUpload");

    const saveBtn = document.getElementById("saveProfile");

    /* ==========================
       LOAD PROFILE
    ========================== */

    function loadProfile() {

        const user = JSON.parse(
            localStorage.getItem("bbiplUser")
        );

        if (!user) return;

        name.value = user.name || "";
        email.value = user.email || "";
        phone.value = user.phone || "";
        designation.value = user.role || "";
        bio.value = user.bio || "";

        if (user.image) {

            profileImage.src = user.image;

        }

    }

    loadProfile();

    /* ==========================
       IMAGE UPLOAD
    ========================== */

    imageUpload.addEventListener("change", function () {

        const file = this.files[0];

        if (!file) return;

        if (!file.type.startsWith("image/")) {

            alert("Please select an image.");

            return;

        }

        const reader = new FileReader();

        reader.onload = function (e) {

            profileImage.src = e.target.result;

        };

        reader.readAsDataURL(file);

    });

    /* ==========================
       SAVE PROFILE
    ========================== */

    saveBtn.addEventListener("click", function (e) {

        e.preventDefault();

        const user = {

            name: name.value.trim(),

            email: email.value.trim(),

            phone: phone.value.trim(),

            role: designation.value.trim(),

            bio: bio.value.trim(),

            image: profileImage.src

        };

        localStorage.setItem(

            "bbiplUser",

            JSON.stringify(user)

        );

        if (window.APP) {

            APP.updateProfile(user);

        }

        if (window.showToast) {

            showToast("Profile Updated Successfully");

        } else {

            alert("Profile Updated Successfully");

        }

    });

    /* ==========================
       RESET PROFILE
    ========================== */

    const resetBtn = document.getElementById("resetProfile");

    if (resetBtn) {

        resetBtn.addEventListener("click", () => {

            if (!confirm("Reset profile changes?")) return;

            loadProfile();

        });

    }

});
