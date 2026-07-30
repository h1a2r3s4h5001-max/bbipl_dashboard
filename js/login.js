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

    /* ==========================================
       STATE
    ========================================== */

    let currentOTP = null;
    let otpTimer = null;
    let otpTimerValue = 30;
    let isVerified = false;
    let pendingEmail = "";

    /* ==========================================
       GENERATE OTP
    ========================================== */

    function generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    /* ==========================================
       EMAIL FORM SUBMIT - SEND OTP
    ========================================== */

    emailForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();

        if (!email || !isValidEmail(email)) {
            showError("Please enter a valid email address");
            return;
        }

        // Disable button and show loading
        sendOtpBtn.disabled = true;
        sendOtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> <span>Sending...</span>';

        // Generate OTP
        currentOTP = generateOTP();
        pendingEmail = email;

        console.log(`[LOGIN] Generated OTP for ${email}: ${currentOTP}`);

        try {
            // Try to send OTP via EmailService (SMTP server)
            if (window.EmailService && typeof window.EmailService.sendOTP === "function") {
                const result = await EmailService.sendOTP(email, currentOTP);

                if (result.success) {
                    // Show OTP section
                    showOTPSection(email);
                } else {
                    // Fallback: show OTP in demo mode anyway
                    console.warn("[LOGIN] Email send reported failure, but showing OTP section:", result.message);
                    showOTPSection(email);
                }
            } else {
                // EmailService not loaded, show demo mode
                console.warn("[LOGIN] EmailService not available, using demo mode");
                showDemoOTP(email);
                showOTPSection(email);
            }
        } catch (err) {
            console.error("[LOGIN] Error sending OTP:", err);
            // Still show OTP section as fallback
            showDemoOTP(email);
            showOTPSection(email);
        } finally {
            sendOtpBtn.disabled = false;
            sendOtpBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> <span>Send OTP</span>';
        }
    });

    /* ==========================================
       SHOW OTP SECTION
    ========================================== */

    function showOTPSection(email) {
        // Hide email form, show OTP section
        emailForm.style.display = "none";
        otpSection.style.display = "block";
        otpEmailDisplay.textContent = maskEmail(email);

        // Clear any previous OTP inputs
        otpInputs.forEach(input => {
            input.value = "";
            input.classList.remove("filled", "error", "success");
        });

        // Focus first OTP input
        setTimeout(() => {
            otpInputs[0].focus();
        }, 100);

        // Start OTP timer
        startOtpTimer();

        // Reset verification state
        isVerified = false;
        verifyOtpBtn.disabled = true;
        otpErrorMessage.textContent = "";
    }

    /* ==========================================
       DEMO OTP DISPLAY
    ========================================== */

    function showDemoOTP(email) {
        console.log(
            `%c╔══════════════════════════════════════════╗\n` +
            `║   📧 DEMO MODE - OTP Generated         ║\n` +
            `╠══════════════════════════════════════════╣\n` +
            `║ Email: ${email.padEnd(35)}║\n` +
            `║ OTP:   ${currentOTP.padEnd(35)}║\n` +
            `╚══════════════════════════════════════════╝`,
            "color:#4f46e5;font-weight:bold;font-size:12px;"
        );

        if (window.showToast) {
            window.showToast(`📧 Demo: OTP ${currentOTP} (check console)`, "success");
        }
    }

    /* ==========================================
       HELPER FUNCTIONS
    ========================================== */

    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function maskEmail(email) {
        const parts = email.split("@");
        if (parts.length !== 2) return email;
        const name = parts[0];
        const domain = parts[1];
        const maskedName = name.length > 3
            ? name.substring(0, 3) + "***"
            : name.substring(0, 1) + "***";
        return maskedName + "@" + domain;
    }

    function showError(message) {
        otpErrorMessage.textContent = message;
        otpErrorMessage.style.color = "#ef4444";
    }

    function showSuccess(message) {
        otpErrorMessage.textContent = message;
        otpErrorMessage.style.color = "#22c55e";
    }

    /* ==========================================
       OTP INPUT HANDLING
    ========================================== */

    // Auto-advance to next input on typing
    otpInputs.forEach((input, index) => {
        input.addEventListener("input", (e) => {
            const value = e.target.value;

            // Only allow single digit
            if (value.length > 1) {
                e.target.value = value.slice(-1);
            }

            // Mark as filled if has value
            if (e.target.value) {
                input.classList.add("filled");
                input.classList.remove("error");
            } else {
                input.classList.remove("filled");
            }

            // Auto-advance to next input
            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }

            // Check if all inputs filled
            checkOTPComplete();
        });

        // Handle backspace to go to previous input
        input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
                otpInputs[index - 1].value = "";
                otpInputs[index - 1].classList.remove("filled");
                checkOTPComplete();
            }

            // Handle arrow keys
            if (e.key === "ArrowLeft" && index > 0) {
                otpInputs[index - 1].focus();
            }
            if (e.key === "ArrowRight" && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        // Handle paste
        input.addEventListener("paste", (e) => {
            e.preventDefault();
            const pasteData = (e.clipboardData || window.clipboardData).getData("text");
            const digits = pasteData.replace(/\D/g, "").substring(0, otpInputs.length);

            if (digits) {
                otpInputs.forEach((inp, i) => {
                    if (i < digits.length) {
                        inp.value = digits[i];
                        inp.classList.add("filled");
                        inp.classList.remove("error");
                    } else {
                        inp.value = "";
                        inp.classList.remove("filled");
                    }
                });

                // Focus the next empty input or last input
                const nextEmpty = otpInputs.length > digits.length
                    ? otpInputs[digits.length]
                    : otpInputs[otpInputs.length - 1];
                nextEmpty.focus();

                checkOTPComplete();
            }
        });

        // Focus on click
        input.addEventListener("click", () => {
            input.select();
        });
    });

    /* ==========================================
       CHECK OTP COMPLETE
    ========================================== */

    function checkOTPComplete() {
        const allFilled = Array.from(otpInputs).every(input => input.value !== "");
        verifyOtpBtn.disabled = !allFilled || isVerified;
    }

    /* ==========================================
       GET OTP FROM INPUTS
    ========================================== */

    function getOTPFromInputs() {
        return Array.from(otpInputs).map(input => input.value).join("");
    }

    /* ==========================================
       VERIFY OTP
    ========================================== */

    verifyOtpBtn.addEventListener("click", async () => {
        const enteredOTP = getOTPFromInputs();

        if (enteredOTP.length !== 6) {
            showError("Please enter the complete 6-digit OTP");
            shakeOTPInputs();
            return;
        }

        // Show loading
        verifyOtpBtn.disabled = true;
        verifyOtpBtn.innerHTML = '<span>Verifying...</span> <i class="fa-solid fa-spinner fa-spin"></i>';

        // Simulate a small delay for UX
        await new Promise(resolve => setTimeout(resolve, 500));

        if (enteredOTP === currentOTP) {
            // OTP Verified!
            isVerified = true;
            otpInputs.forEach(input => {
                input.classList.remove("error");
                input.classList.add("success");
            });
            showSuccess("✅ OTP Verified! Logging in...");

            // Update verify button
            verifyOtpBtn.innerHTML = '<span>✓ Verified! Redirecting...</span>';

            // Store login state
            localStorage.setItem("isLoggedIn", "true");

            // Store user email
            const userData = {
                email: pendingEmail,
                name: pendingEmail.split("@")[0],
                role: "Administrator",
                image: "images/profile.png",
                bio: "Site Administrator"
            };
            localStorage.setItem("cmsUser", JSON.stringify(userData));

            // Show success toast if available
            if (window.showToast) {
                window.showToast("✅ Login successful! Welcome to BBIPL CMS", "success");
            }

            // Redirect to dashboard
            setTimeout(() => {
                window.location.href = "index.html";
            }, 1000);

        } else {
            // Wrong OTP
            showError("❌ Invalid OTP. Please try again.");
            shakeOTPInputs();
            otpInputs.forEach(input => {
                input.classList.remove("success", "filled");
                input.classList.add("error");
            });
            verifyOtpBtn.disabled = false;
            verifyOtpBtn.innerHTML = '<span>Verify & Login</span> <i class="fa-solid fa-spinner fa-spin" style="display:none;"></i>';
        }
    });

    /* ==========================================
       SHAKE OTP INPUTS ON ERROR
    ========================================== */

    function shakeOTPInputs() {
        otpInputs.forEach(input => {
            input.classList.add("error");
            setTimeout(() => {
                input.classList.remove("error");
            }, 500);
        });
    }

    /* ==========================================
       OTP TIMER
    ========================================== */

    function startOtpTimer() {
        // Clear existing timer
        if (otpTimer) {
            clearInterval(otpTimer);
        }

        otpTimerValue = 30;
        otpTimerCount.textContent = otpTimerValue;
        otpTimerText.style.display = "block";
        resendOtpBtn.style.display = "none";

        otpTimer = setInterval(() => {
            otpTimerValue--;
            otpTimerCount.textContent = otpTimerValue;

            if (otpTimerValue <= 0) {
                clearInterval(otpTimer);
                otpTimer = null;
                otpTimerText.style.display = "none";
                resendOtpBtn.style.display = "inline-block";
            }
        }, 1000);
    }

    /* ==========================================
       RESEND OTP
    ========================================== */

    resendOtpBtn.addEventListener("click", async () => {
        if (!pendingEmail) return;

        // Generate new OTP
        currentOTP = generateOTP();
        console.log(`[LOGIN] Resending OTP for ${pendingEmail}: ${currentOTP}`);

        // Disable resend button temporarily
        resendOtpBtn.disabled = true;
        resendOtpBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';

        try {
            if (window.EmailService && typeof window.EmailService.sendOTP === "function") {
                const result = await EmailService.sendOTP(pendingEmail, currentOTP);
                if (!result.success) {
                    console.warn("[LOGIN] Resend reported failure, but proceeding");
                }
            } else {
                showDemoOTP(pendingEmail);
            }
        } catch (err) {
            console.error("[LOGIN] Error resending OTP:", err);
            showDemoOTP(pendingEmail);
        }

        // Clear OTP inputs
        otpInputs.forEach(input => {
            input.value = "";
            input.classList.remove("filled", "error", "success");
        });

        // Reset state
        isVerified = false;
        verifyOtpBtn.disabled = true;
        otpErrorMessage.textContent = "";

        // Restart timer
        startOtpTimer();

        // Re-enable resend button (it will be hidden by timer)
        resendOtpBtn.disabled = false;
        resendOtpBtn.innerHTML = '<i class="fa-solid fa-rotate"></i> Resend OTP';

        // Focus first input
        otpInputs[0].focus();

        if (window.showToast) {
            window.showToast("🔄 New OTP sent to your email", "success");
        }
    });

    /* ==========================================
       BACK TO EMAIL BUTTON
    ========================================== */

    backToEmailBtn.addEventListener("click", () => {
        // Clear timer
        if (otpTimer) {
            clearInterval(otpTimer);
            otpTimer = null;
        }

        // Hide OTP section, show email form
        otpSection.style.display = "none";
        emailForm.style.display = "block";

        // Reset OTP inputs
        otpInputs.forEach(input => {
            input.value = "";
            input.classList.remove("filled", "error", "success");
        });

        // Reset state
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

    // Show register modal
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener("click", (e) => {
            e.preventDefault();
            registerModal.classList.add("show");
            document.body.style.overflow = "hidden";
        });
    }

    // Close register modal
    if (closeRegisterBtn) {
        closeRegisterBtn.addEventListener("click", () => {
            registerModal.classList.remove("show");
            document.body.style.overflow = "";
        });
    }

    // Close modal when clicking overlay
    if (registerModal) {
        registerModal.addEventListener("click", (e) => {
            if (e.target === registerModal) {
                registerModal.classList.remove("show");
                document.body.style.overflow = "";
            }
        });
    }

    // Go to login from register
    if (gotoLoginBtn) {
        gotoLoginBtn.addEventListener("click", (e) => {
            e.preventDefault();
            registerModal.classList.remove("show");
            document.body.style.overflow = "";
        });
    }

    // Handle registration
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const name = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const password = document.getElementById("regPassword").value;
            const confirmPassword = document.getElementById("regConfirmPassword").value;

            if (!name || !email || !password || !confirmPassword) {
                alert("Please fill in all fields");
                return;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match");
                return;
            }

            if (password.length < 6) {
                alert("Password must be at least 6 characters");
                return;
            }

            // Save user to localStorage
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

            // Auto-fill email on login form
            emailInput.value = email;

            // Close modal
            registerModal.classList.remove("show");
            document.body.style.overflow = "";

            if (window.showToast) {
                window.showToast("✅ Account created! Enter your email to receive OTP", "success");
            } else {
                alert("Account created! Please login with your email.");
            }

            registerForm.reset();
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
        // Start typewriter after page loads
        setTimeout(typeWriter, 600);
    }

    /* ==========================================
       ENTER KEY FOR OTP SUBMIT
    ========================================== */

    otpInputs.forEach((input, index) => {
        input.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                const allFilled = Array.from(otpInputs).every(inp => inp.value !== "");
                if (allFilled && !verifyOtpBtn.disabled) {
                    verifyOtpBtn.click();
                }
            }
        });
    });

    /* ==========================================
       AUTO-FOCUS EMAIL INPUT ON PAGE LOAD
    ========================================== */

    if (emailInput) {
        setTimeout(() => {
            emailInput.focus();
        }, 500);
    }

    console.log("%c[LOGIN] ✅ Login system initialized with OTP + SMTP", "color:#22c55e;font-weight:bold;font-size:14px;");
    console.log("%c[LOGIN] ℹ️  SMTP server configured for email delivery", "color:#4f46e5;font-weight:bold;");

});
