/* ==========================================================
   BBIPL Central Management System
   login.js - OTP-based Login with SMTP Email Verification
========================================================== */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

    /* ==========================================
       DOM REFERENCES
    ========================================== */

    const emailForm = document.getElementById("emailForm");
    const emailInput = document.getElementById("email");
    const otpSection = document.getElementById("otpSection");
    const otpEmailDisplay = document.getElementById("otpEmailDisplay");
    const otpInputs = document.querySelectorAll(".otp-input");
    const verifyOtpBtn = document.getElementById("verifyOtpBtn");
    const otpErrorMessage = document.getElementById("otpErrorMessage");
    const otpTimerText = document.getElementById("otpTimerText");
    const otpTimerCount = document.getElementById("otpTimerCount");
    const resendOtpBtn = document.getElementById("resendOtpBtn");
    const backToEmailBtn = document.getElementById("backToEmailBtn");
    const loginForm = document.getElementById("loginForm");
    const sendOtpBtn = document.querySelector(".send-otp-btn");

    // Register modal
    const showRegisterBtn = document.getElementById("showRegisterBtn");
    const registerModal = document.getElementById("registerModal");
    const closeRegisterBtn = document.getElementById("closeRegisterBtn");
    const registerForm = document.getElementById("registerForm");
    const gotoLoginBtn = document.getElementById("gotoLoginBtn");

    // Password toggle
    const togglePassword = document.querySelector(".togglePassword");
    const passwordInput = document.getElementById("password");

    // Registration OTP DOM elements
    const regOtpSection = document.getElementById("regOtpSection");
    const regOtpInputs = document.querySelectorAll(".reg-otp-input");
    const regVerifyOtpBtn = document.getElementById("regVerifyOtpBtn");
    const regOtpErrorMessage = document.getElementById("regOtpErrorMessage");
    const regOtpTimerText = document.getElementById("regOtpTimerText");
    const regOtpTimerCount = document.getElementById("regOtpTimerCount");
    const regResendOtpBtn = document.getElementById("regResendOtpBtn");
    const regBackToFormBtn = document.getElementById("regBackToFormBtn");
    const regOtpEmailDisplay = document.getElementById("regOtpEmailDisplay");
    const registerSubmitBtn = document.getElementById("registerSubmitBtn");

    /* ==========================================
       SHARED OTP UTILITY OBJECT
    ========================================== */

    const OTP = {

        generate() {
            return Math.floor(100000 + Math.random() * 900000).toString();
        },

        isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        },

        maskEmail(email) {
            const parts = email.split("@");
            if (parts.length !== 2) return email;
            const name = parts[0];
            const domain = parts[1];
            const maskedName = name.length > 3
                ? name.substring(0, 3) + "***"
                : name.substring(0, 1) + "***";
            return maskedName + "@" + domain;
        },

        bindInputs(inputs, onComplete, verifyBtn) {
            inputs.forEach((input, index) => {
                input.addEventListener("input", (e) => {
                    const value = e.target.value;
                    if (value.length > 1) {
                        e.target.value = value.slice(-1);
                    }
                    if (e.target.value) {
                        input.classList.add("filled");
                        input.classList.remove("error");
                    } else {
                        input.classList.remove("filled");
                    }
                    if (e.target.value && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                    onComplete();
                });

                input.addEventListener("keydown", (e) => {
                    if (e.key === "Backspace" && !e.target.value && index > 0) {
                        inputs[index - 1].focus();
                        inputs[index - 1].value = "";
                        inputs[index - 1].classList.remove("filled");
                        onComplete();
                    }
                    if (e.key === "ArrowLeft" && index > 0) {
                        inputs[index - 1].focus();
                    }
                    if (e.key === "ArrowRight" && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                    if (e.key === "Enter") {
                        const allFilled = Array.from(inputs).every(inp => inp.value !== "");
                        if (allFilled && verifyBtn && !verifyBtn.disabled) {
                            verifyBtn.click();
                        }
                    }
                });

                input.addEventListener("paste", (e) => {
                    e.preventDefault();
                    const pasteData = (e.clipboardData || window.clipboardData).getData("text");
                    const digits = pasteData.replace(/\D/g, "").substring(0, inputs.length);
                    if (digits) {
                        inputs.forEach((inp, i) => {
                            if (i < digits.length) {
                                inp.value = digits[i];
                                inp.classList.add("filled");
                                inp.classList.remove("error");
                            } else {
                                inp.value = "";
                                inp.classList.remove("filled");
                            }
                        });
                        const nextEmpty = inputs.length > digits.length
                            ? inputs[digits.length]
                            : inputs[inputs.length - 1];
                        nextEmpty.focus();
                        onComplete();
                    }
                });

                input.addEventListener("click", () => {
                    input.select();
                });
            });
        },

        isComplete(inputs) {
            return Array.from(inputs).every(input => input.value !== "");
        },

        getValue(inputs) {
            return Array.from(inputs).map(input => input.value).join("");
        },

        shake(inputs) {
            inputs.forEach(input => {
                input.classList.add("error");
                setTimeout(() => {
                    input.classList.remove("error");
                }, 500);
            });
        },

        clearInputs(inputs) {
            inputs.forEach(input => {
                input.value = "";
                input.classList.remove("filled", "error", "success");
            });
        },

        showError(el, message) {
            el.textContent = message;
            el.style.color = "#ef4444";
        },

        showSuccess(el, message) {
            el.textContent = message;
            el.style.color = "#22c55e";
        },

        markSuccess(inputs) {
            inputs.forEach(input => {
                input.classList.remove("error");
                input.classList.add("success");
            });
        },

        markError(inputs) {
            inputs.forEach(input => {
                input.classList.remove("success", "filled");
                input.classList.add("error");
            });
        },

        startTimer(timerTextEl, timerCountEl, resendBtnEl, duration = 30) {
            let remaining = duration;
            timerCountEl.textContent = remaining;
            timerTextEl.style.display = "block";
            resendBtnEl.style.display = "none";

            const interval = setInterval(() => {
                remaining--;
                timerCountEl.textContent = remaining;
                if (remaining <= 0) {
                    clearInterval(interval);
                    timerTextEl.style.display = "none";
                    resendBtnEl.style.display = "inline-block";
                }
            }, 1000);

            return () => clearInterval(interval);
        },

        async sendOTPEmail(email, otp) {
            try {
                if (window.EmailService && typeof window.EmailService.sendOTP === "function") {
                    const result = await EmailService.sendOTP(email, otp);
                    return result.success;
                }
            } catch (err) {
                console.error("[OTP] Error sending email:", err);
            }
            return false;
        },

        logDemoOTP(email, otp, context = "DEMO") {
            console.log(
                "[OTP] " + context + " - Email: " + email + " | OTP: " + otp
            );
            if (window.showToast) {
                window.showToast("📧 " + context + ": OTP " + otp + " (check console)", "warning");
            }
        }
    };

    /* ==========================================
       STATE
    ========================================== */

    let currentOTP = null;
    let otpTimerCleanup = null;
    let isVerified = false;
    let pendingEmail = "";

    let regCurrentOTP = null;
    let regOtpTimerCleanup = null;
    let regIsVerified = false;
    let regPendingData = {};

    /* ==========================================
       BIND OTP INPUT EVENTS
    ========================================== */

    function checkLoginOTPComplete() {
        verifyOtpBtn.disabled = !OTP.isComplete(otpInputs) || isVerified;
    }

    function checkRegOTPComplete() {
        regVerifyOtpBtn.disabled = !OTP.isComplete(regOtpInputs) || regIsVerified;
    }

    OTP.bindInputs(otpInputs, checkLoginOTPComplete, verifyOtpBtn);
    OTP.bindInputs(regOtpInputs, checkRegOTPComplete, regVerifyOtpBtn);

    /* ==========================================
       EMAIL FORM SUBMIT - SEND OTP
    ========================================== */

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        if (!email || !OTP.isValidEmail(email)) {
            OTP.showError(otpErrorMessage, "Please enter a valid email address");
            return;
        }

        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>';

        currentOTP = OTP.generate();
        pendingEmail = email;
        console.log("[LOGIN] Generated OTP for " + email + ": " + currentOTP);

        const sent = await OTP.sendOTPEmail(email, currentOTP);
        if (!sent) {
            OTP.logDemoOTP(email, currentOTP, "LOGIN DEMO");
        }

        showOTPSection(email);

        sendOtpBtn.disabled = false;
        sendOtpBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Send OTP</span>';
    });

    /* ==========================================
       SHOW OTP SECTION
    ========================================== */

    function showOTPSection(email) {
        emailForm.style.display = "none";
        otpSection.style.display = "block";
        otpEmailDisplay.textContent = OTP.maskEmail(email);

        OTP.clearInputs(otpInputs);

        setTimeout(() => {
            if (otpInputs[0]) otpInputs[0].focus();
        }, 100);

        if (otpTimerCleanup) otpTimerCleanup();
        otpTimerCleanup = OTP.startTimer(otpTimerText, otpTimerCount, resendOtpBtn);

        isVerified = false;
        verifyOtpBtn.disabled = true;
        otpErrorMessage.textContent = "";
    }

    /* ==========================================
       VERIFY OTP - LOGIN
    ========================================== */

    verifyOtpBtn.addEventListener("click", async () => {
        const enteredOTP = OTP.getValue(otpInputs);

        if (enteredOTP.length !== 6) {
            OTP.showError(otpErrorMessage, "Please enter the complete 6-digit OTP");
            OTP.shake(otpInputs);
            return;
        }

        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

        await new Promise(resolve => setTimeout(resolve, 500));

        if (enteredOTP === currentOTP) {
            isVerified = true;
            OTP.markSuccess(otpInputs);
            OTP.showSuccess(otpErrorMessage, "✅ OTP Verified! Logging in...");
            verifyOtpBtn.innerHTML = '<span>✓ Verified! Redirecting...</span>';

            localStorage.setItem("isLoggedIn", "true");

            const userData = {
                email: pendingEmail,
                name: pendingEmail.split("@")[0],
                role: "Administrator",
                image: "images/profile.png",
                bio: "Site Administrator"
            };
            localStorage.setItem("cmsUser", JSON.stringify(userData));

            if (window.showToast) {
                window.showToast("✅ Login successful! Welcome to BBIPL CMS", "success");
            }

            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } else {
            OTP.showError(otpErrorMessage, "❌ Invalid OTP. Please try again.");
            OTP.shake(otpInputs);
            OTP.markError(otpInputs);
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.innerHTML = '<span>Verify & Login</span> <i class="fa-solid fa-spinner fa-spin" style="display:none;"></i>';
        }
    });

    /* ==========================================
       RESEND OTP - LOGIN
    ========================================== */

    resendOtpBtn.addEventListener("click", async () => {
        if (!pendingEmail) return;

        currentOTP = OTP.generate();
        console.log("[LOGIN] Resending OTP for " + pendingEmail + ": " + currentOTP);

        resendOtpBtn.disabled = true;
        resendOtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        const sent = await OTP.sendOTPEmail(pendingEmail, currentOTP);
        if (!sent) {
            OTP.logDemoOTP(pendingEmail, currentOTP, "LOGIN DEMO");
        }

        OTP.clearInputs(otpInputs);
        isVerified = false;
        verifyOtpBtn.disabled = true;
        otpErrorMessage.textContent = "";

        if (otpTimerCleanup) otpTimerCleanup();
        otpTimerCleanup = OTP.startTimer(otpTimerText, otpTimerCount, resendOtpBtn);

        resendOtpBtn.disabled = false;
        resendOtpBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Resend OTP';
        if (otpInputs[0]) otpInputs[0].focus();

        if (window.showToast) {
            window.showToast("🔄 New OTP sent to your email", "success");
        }
    });

    /* ==========================================
       BACK TO EMAIL BUTTON
    ========================================== */

    backToEmailBtn.addEventListener("click", () => {
        if (otpTimerCleanup) otpTimerCleanup();

        otpSection.style.display = "none";
        emailForm.style.display = "block";

        OTP.clearInputs(otpInputs);
        isVerified = false;
        verifyOtpBtn.disabled = true;
        otpErrorMessage.textContent = "";
        currentOTP = null;
    });

    /* ==========================================
       PASSWORD LOGIN FALLBACK
    ========================================== */

    loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("passwordEmail").value.trim();
        const password = document.getElementById("password").value;

        if (email === "admin@example.com" && password === "admin123") {
            localStorage.setItem("isLoggedIn", "true");
            window.location.href = "index.html";
        } else {
            alert("Invalid credentials. Use admin@example.com / admin123");
        }
    });

    /* ==========================================
       PASSWORD TOGGLE VISIBILITY
    ========================================== */

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", () => {
            const type = passwordInput.type === "password" ? "text" : "password";
            passwordInput.type = type;
            togglePassword.classList.toggle("fa-eye");
            togglePassword.classList.toggle("fa-eye-slash");
        });
    }

    /* ==========================================
       REGISTER MODAL
    ========================================== */

    if (showRegisterBtn) {
        showRegisterBtn.addEventListener("click", (e) => {
            e.preventDefault();
            registerModal.classList.add("show");
            document.body.style.overflow = "hidden";
        });
    }

    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener("click", () => {
            registerModal.classList.remove("show");
            document.body.style.overflow = "";
        });
    }

    if (registerModal) {
        registerModal.addEventListener("click", (e) => {
            if (e.target === registerModal) {
                registerModal.classList.remove("show");
                document.body.style.overflow = "";
            }
        });
    }

    if (gotoLoginBtn) {
        gotoLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            registerModal.classList.remove("show");
            document.body.style.overflow = "";
        });
    }

    /* ==========================================
       REGISTRATION - SEND OTP
    ========================================== */

    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("regConfirmPassword").value;

            if (!name || !email || !password || !confirmPassword) {
                const msg = "Please fill in all fields";
                if (window.showToast) window.showToast(msg, "error");
                else alert(msg);
                return;
            }

            if (password !== confirmPassword) {
                const msg = "Passwords do not match";
                if (window.showToast) window.showToast(msg, "error");
                else alert(msg);
                return;
            }

            if (password.length < 6) {
                const msg = "Password must be at least 6 characters";
                if (window.showToast) window.showToast(msg, "error");
                else alert(msg);
                return;
            }

            regPendingData = { name, email, password };

            regCurrentOTP = OTP.generate();
            console.log("[REG] Generated OTP for " + email + ": " + regCurrentOTP);

            registerSubmitBtn.disabled = true;
            registerSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending OTP...</span>';

            const sent = await OTP.sendOTPEmail(email, regCurrentOTP);
            if (!sent) {
                OTP.logDemoOTP(email, regCurrentOTP, "REGISTRATION DEMO");
            }

            showRegOtpSection(email);

            registerSubmitBtn.disabled = false;
            registerSubmitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Send OTP & Create Account</span>';
        });
    }

    function showRegOtpSection(email) {
        registerForm.style.display = "none";
        regOtpSection.style.display = "block";
        regOtpEmailDisplay.textContent = OTP.maskEmail(email);

        OTP.clearInputs(regOtpInputs);

        setTimeout(() => {
            if (regOtpInputs[0]) regOtpInputs[0].focus();
        }, 100);

        if (regOtpTimerCleanup) regOtpTimerCleanup();
        regOtpTimerCleanup = OTP.startTimer(regOtpTimerText, regOtpTimerCount, regResendOtpBtn);

        regIsVerified = false;
        regVerifyOtpBtn.disabled = true;
        regOtpErrorMessage.textContent = "";
    }

    /* ==========================================
       REGISTRATION - VERIFY OTP
    ========================================== */

    if (regVerifyOtpBtn) {
        regVerifyOtpBtn.addEventListener("click", async () => {
            const enteredOTP = OTP.getValue(regOtpInputs);

            if (enteredOTP.length !== 6) {
                OTP.showError(regOtpErrorMessage, "Please enter the complete 6-digit OTP");
                OTP.shake(regOtpInputs);
                return;
            }

            regVerifyOtpBtn.disabled = true;
            regVerifyOtpBtn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

            await new Promise(resolve => setTimeout(resolve, 500));

            if (enteredOTP === regCurrentOTP) {
                regIsVerified = true;
                OTP.markSuccess(regOtpInputs);
                OTP.showSuccess(regOtpErrorMessage, "✅ OTP Verified! Creating your account...");
                regVerifyOtpBtn.innerHTML = '<span>✓ Verified! Creating Account...</span>';

                const { name, email, password } = regPendingData;
                const users = JSON.parse(localStorage.getItem("cmsUsers") || "[]");
                const newUser = {
                    id: "user_" + Date.now(),
                    name: name,
                    email: email,
                    password: password,
                    role: "Editor",
                    image: "images/profile.png",
                    createdAt: new Date().toISOString()
                };
                users.push(newUser);
                localStorage.setItem("cmsUsers", JSON.stringify(users));

                emailInput.value = email;

                setTimeout(() => {
                    registerModal.classList.remove("show");
                    document.body.style.overflow = "";

                    registerForm.style.display = "block";
                    regOtpSection.style.display = "none";
                    registerForm.reset();
                    OTP.clearInputs(regOtpInputs);

                    if (window.showToast) {
                        window.showToast("✅ Account created! Enter your email to receive OTP", "success");
                    } else {
                        alert("Account created! Please login with your email.");
                    }
                }, 1200);

            } else {
                OTP.showError(regOtpErrorMessage, "❌ Invalid OTP. Please try again.");
                OTP.shake(regOtpInputs);
                OTP.markError(regOtpInputs);
                regVerifyOtpBtn.disabled = false;
                regVerifyOtpBtn.innerHTML = '<span>Verify & Create Account</span> <i class="fa-solid fa-spinner fa-spin" style="display:none;"></i>';
            }
        });
    }

    /* ==========================================
       REGISTRATION - RESEND OTP
    ========================================== */

    if (regResendOtpBtn) {
        regResendOtpBtn.addEventListener("click", async () => {
            const email = regPendingData.email;
            if (!email) return;

            regCurrentOTP = OTP.generate();
            console.log("[REG] Resending OTP for " + email + ": " + regCurrentOTP);

            regResendOtpBtn.disabled = true;
            regResendOtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

            const sent = await OTP.sendOTPEmail(email, regCurrentOTP);
            if (!sent) {
                OTP.logDemoOTP(email, regCurrentOTP, "REGISTRATION DEMO");
            }

            OTP.clearInputs(regOtpInputs);
            regIsVerified = false;
            regVerifyOtpBtn.disabled = true;
            regOtpErrorMessage.textContent = "";

            if (regOtpTimerCleanup) regOtpTimerCleanup();
            regOtpTimerCleanup = OTP.startTimer(regOtpTimerText, regOtpTimerCount, regResendOtpBtn);

            regResendOtpBtn.disabled = false;
            regResendOtpBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Resend OTP';
            if (regOtpInputs[0]) regOtpInputs[0].focus();

            if (window.showToast) {
                window.showToast("🔄 New OTP sent to your email", "success");
            }
        });
    }

    /* ==========================================
       REGISTRATION - BACK TO FORM
    ========================================== */

    if (regBackToFormBtn) {
        regBackToFormBtn.addEventListener("click", () => {
            if (regOtpTimerCleanup) regOtpTimerCleanup();

            regOtpSection.style.display = "none";
            registerForm.style.display = "block";

            OTP.clearInputs(regOtpInputs);
            regIsVerified = false;
            regVerifyOtpBtn.disabled = true;
            regOtpErrorMessage.textContent = "";
            regCurrentOTP = null;
        });
    }

    /* ==========================================
       TYPEWRITER EFFECT FOR HEADING
    ========================================== */

    const heading = document.querySelector(".login-left h2");
    if (heading) {
        const text = heading.textContent;
        heading.textContent = "";
        heading.style.visibility = "visible";

        let charIndex = 0;
        function typeWriter() {
            if (charIndex < text.length) {
                heading.textContent += text.charAt(charIndex);
                charIndex++;
                setTimeout(typeWriter, 40);
            }
        }
        setTimeout(typeWriter, 600);
    }

    /* ==========================================
       AUTO-FOCUS EMAIL INPUT ON PAGE LOAD
    ========================================== */

    if (emailInput) {
        setTimeout(() => {
            emailInput.focus();
        }, 500);
    }

    console.log("%c[LOGIN] ✅ Login system initialized with OTP + SMTP", "color:#22c55e;font-weight:bold;font-size:14px;");

});
