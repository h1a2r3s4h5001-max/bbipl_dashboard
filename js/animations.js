/* ==========================================================
   BBIPL Central Management System
   animations.js - Premium Animation Engine v2.0
   Features: Scroll Reveal, Counters, TypeWriter, Stagger,
             Ripple, Particles, Skeleton, Page Transition,
             Parallax, 3D Tilt, Magnetic Buttons, Confetti,
             Text Split, Morphing BG, Glow Effects
========================================================== */

"use strict";

const Animator = {

    /* ==========================================
       INIT - Call this once on DOMContentLoaded
    ========================================== */

    init() {
        this.initScrollReveal();
        this.initRippleEffects();
        this.initStaggerAnimations();
        this.initSkeletonLoaders();
        this.initPageTransition();
        this.initMagneticButtons();
        this.initTiltCards();
        this.initCounters();
        this.initParallax();
        this.autoAnimate();
    },

    /* ==========================================
       EASING HELPERS
    ========================================== */

    easings: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        smooth: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        bounce: "cubic-bezier(0.68, -0.55, 0.27, 1.55)",
        easeOut: "cubic-bezier(0.16, 1, 0.3, 1)",
        easeInOut: "cubic-bezier(0.65, 0, 0.35, 1)",
        elastic: "cubic-bezier(0.68, -0.6, 0.32, 1.6)"
    },

    /* ==========================================
       COUNTER ANIMATION
       Usage: Animator.counter(elementId, endValue, duration)
              or data-counter="1500" on element
    ========================================== */

    counter(id, endValue, duration = 1500) {
        const element = typeof id === "string" ? document.getElementById(id) : id;
        if (!element) return;

        const startTime = performance.now();
        const startValue = 0;

        const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = Math.floor(easedProgress * endValue);

            element.textContent = currentValue.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = endValue.toLocaleString();
                // Celebration pulse
                element.style.transition = "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)";
                element.style.transform = "scale(1.15)";
                setTimeout(() => { element.style.transform = "scale(1)"; }, 300);
            }
        }

        requestAnimationFrame(update);
    },

    /* ==========================================
       COUNTER WITH INTERSECTION OBSERVER
       data-counter="1500" data-duration="2000"
    ========================================== */

    initCounters() {
        document.querySelectorAll("[data-counter]").forEach(el => {
            const target = parseInt(el.dataset.counter) || 0;
            const duration = parseInt(el.dataset.duration) || 1500;
            let animated = false;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !animated) {
                        animated = true;
                        this.counter(el, target, duration);
                        observer.unobserve(el);
                    }
                });
            }, { threshold: 0.3 });

            observer.observe(el);
        });
    },

    /* ==========================================
       SCROLL REVEAL - Premium
       Elements with class 'reveal' animate in
       when scrolled into view.

       Data attributes:
       data-reveal="fade-up|fade-down|fade-left|fade-right|scale|rotate|flip|zoom"
       data-delay="ms"
       data-duration="ms"
       data-distance="px"
    ========================================== */

    initScrollReveal() {
        const revealElements = document.querySelectorAll(".reveal");
        if (revealElements.length === 0) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const effect = el.dataset.reveal || "fade-up";
                    const delay = parseInt(el.dataset.delay) || 0;
                    const duration = parseInt(el.dataset.duration) || 700;
                    const distance = parseInt(el.dataset.distance) || 40;

                    const animationMap = {
                        "fade-up": { anim: "anim-premium-fade-up", distance: distance },
                        "fade-down": { anim: "anim-premium-fade-down", distance: distance },
                        "fade-left": { anim: "anim-premium-fade-left", distance: distance },
                        "fade-right": { anim: "anim-premium-fade-right", distance: distance },
                        "scale": { anim: "anim-premium-scale", distance: 0 },
                        "rotate": { anim: "anim-premium-rotate", distance: 0 },
                        "flip": { anim: "anim-premium-flip", distance: 0 },
                        "zoom": { anim: "anim-premium-zoom", distance: 0 },
                        "fade": { anim: "anim-premium-fade", distance: 0 }
                    };

                    const config = animationMap[effect] || animationMap["fade-up"];
                    const animClass = config.anim;

                    // Set custom properties
                    el.style.setProperty("--anim-distance", config.distance + "px");
                    el.style.setProperty("--anim-duration", duration + "ms");
                    el.style.setProperty("--anim-delay", delay + "ms");

                    el.classList.add(animClass);

                    // Add a subtle glow sweep
                    if (effect === "scale" || effect === "zoom") {
                        el.classList.add("reveal-glow");
                    }

                    observer.unobserve(el);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -40px 0px"
        });

        revealElements.forEach(el => {
            el.style.opacity = "0";
            el.style.willChange = "transform, opacity";
            observer.observe(el);
        });
    },

    /* ==========================================
       TYPEWRITER EFFECT - Premium
       Usage: Animator.typeWriter(elementId, text, speed)
              or data-typewriter on element
    ========================================== */

    typeWriter(id, text, speed = 50, callback = null) {
        const element = typeof id === "string" ? document.getElementById(id) : id;
        if (!element) return;

        element.textContent = "";
        element.style.visibility = "visible";
        element.classList.add("typing-cursor");

        let i = 0;
        let lastTime = 0;

        function type(timestamp) {
            if (!lastTime) lastTime = timestamp;
            if (timestamp - lastTime >= speed) {
                if (i < text.length) {
                    // Add character with a slight random variation for realism
                    const char = text.charAt(i);
                    element.textContent += char;
                    i++;
                    lastTime = timestamp;
                    // Random speed variation
                    speed = 50 + (Math.random() * 30 - 15);
                } else {
                    element.classList.remove("typing-cursor");
                    // Add a subtle glow
                    element.style.transition = "text-shadow 0.5s ease";
                    element.style.textShadow = "0 0 20px rgba(79,70,229,0.3)";
                    setTimeout(() => {
                        element.style.textShadow = "none";
                    }, 1000);
                    if (callback) callback();
                    return;
                }
            }
            requestAnimationFrame(type);
        }

        requestAnimationFrame(type);
    },

    /* ==========================================
       STAGGER ANIMATION
       Usage: Animator.stagger(containerSelector, animationClass, staggerDelay)
              or data-stagger on container
    ========================================== */

    stagger(containerSelector, animationClass = "stagger-item", staggerDelay = 60) {
        const container = typeof containerSelector === "string"
            ? document.querySelector(containerSelector)
            : containerSelector;
        if (!container) return;

        const children = container.children;
        if (!children.length) return;

        const easing = this.easings.spring;

        Array.from(children).forEach((child, index) => {
            child.style.opacity = "0";
            child.style.transform = "translateY(20px) scale(0.95)";
            child.style.transition = `all 0.6s ${easing} ${index * staggerDelay}ms`;
            // Force reflow
            child.offsetHeight;
            child.style.opacity = "1";
            child.style.transform = "translateY(0) scale(1)";
        });
    },

    initStaggerAnimations() {
        document.querySelectorAll("[data-stagger]").forEach(container => {
            const delay = parseInt(container.dataset.staggerDelay) || 60;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.stagger(container, "stagger-item", delay);
                        observer.unobserve(container);
                    }
                });
            }, { threshold: 0.1 });

            observer.observe(container);
        });
    },

    /* ==========================================
       RIPPLE EFFECT - Premium Material
       Usage: <button class="ripple">Click</button>
    ========================================== */

    initRippleEffects() {
        document.addEventListener("click", (e) => {
            const btn = e.target.closest(".ripple");
            if (!btn) return;

            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height) * 2;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            const ripple = document.createElement("span");
            ripple.className = "ripple-effect";
            ripple.style.width = ripple.style.height = size + "px";
            ripple.style.left = x + "px";
            ripple.style.top = y + "px";

            btn.appendChild(ripple);

            // Multiple ripple layers for depth
            const ripple2 = ripple.cloneNode();
            ripple2.style.width = ripple.style.height = size * 0.6 + "px";
            ripple2.style.left = (x + size * 0.2) + "px";
            ripple2.style.top = (y + size * 0.2) + "px";
            ripple2.style.animationDuration = "0.8s";
            ripple2.style.background = "rgba(255,255,255,0.2)";
            btn.appendChild(ripple2);

            setTimeout(() => {
                ripple.remove();
                ripple2.remove();
            }, 800);
        });
    },

    /* ==========================================
       MAGNETIC BUTTONS
       Buttons that follow cursor slightly
       Usage: <button class="magnetic">Hover</button>
    ========================================== */

    initMagneticButtons() {
        document.querySelectorAll(".magnetic").forEach(btn => {
            btn.addEventListener("mousemove", (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
            });

            btn.addEventListener("mouseleave", () => {
                btn.style.transition = "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
                btn.style.transform = "translate(0, 0)";
                setTimeout(() => {
                    btn.style.transition = "";
                }, 500);
            });
        });
    },

    /* ==========================================
       3D TILT CARDS
       Cards that tilt on hover with perspective
       Usage: <div class="tilt-card">Content</div>
    ========================================== */

    initTiltCards() {
        document.querySelectorAll(".tilt-card").forEach(card => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = (e.clientX - rect.left) / rect.width - 0.5;
                const y = (e.clientY - rect.top) / rect.height - 0.5;

                card.style.setProperty("--tilt-x", (x * 15) + "deg");
                card.style.setProperty("--tilt-y", (-y * 15) + "deg");

                // Glow effect following cursor
                const glowX = (e.clientX - rect.left) / rect.width * 100;
                const glowY = (e.clientY - rect.top) / rect.height * 100;
                card.style.setProperty("--glow-x", glowX + "%");
                card.style.setProperty("--glow-y", glowY + "%");
            });

            card.addEventListener("mouseleave", () => {
                card.style.setProperty("--tilt-x", "0deg");
                card.style.setProperty("--tilt-y", "0deg");
                card.style.transition = "all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
                setTimeout(() => {
                    card.style.transition = "";
                }, 600);
            });
        });
    },

    /* ==========================================
       FLOATING PARTICLES - Premium
       Animated particle background with depth
       Usage: <div id="particles" data-particles="30"></div>
    ========================================== */

    createParticles(containerId, count = 30) {
        const container = typeof containerId === "string"
            ? document.getElementById(containerId)
            : containerId;
        if (!container) return;

        container.style.position = "relative";
        container.style.overflow = "hidden";

        // Clear existing
        container.querySelectorAll(".floating-particle").forEach(el => el.remove());

        for (let i = 0; i < count; i++) {
            const particle = document.createElement("div");
            particle.className = "floating-particle";

            const size = Math.random() * 8 + 2;
            const isCircle = Math.random() > 0.4;
            const duration = 10 + Math.random() * 20;
            const delay = Math.random() * -15;
            const xDrift = (Math.random() - 0.5) * 100;

            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${this.getRandomColor(0.1 + Math.random() * 0.25)};
                border-radius: ${isCircle ? "50%" : `${Math.random() * 4 + 1}px`};
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                pointer-events: none;
                z-index: 0;
                opacity: 0;
                will-change: transform;
                animation: particleFloat ${duration}s ease-in-out infinite;
                animation-delay: ${delay}s;
                --x-drift: ${xDrift}px;
            `;

            container.appendChild(particle);
        }
    },

    initParticles() {
        document.querySelectorAll("[data-particles]").forEach(el => {
            const count = parseInt(el.dataset.particles) || 30;
            this.createParticles(el, count);
        });
    },

    getRandomColor(alpha = 0.2) {
        const colors = [
            `rgba(79, 70, 229, ${alpha})`,
            `rgba(99, 102, 241, ${alpha})`,
            `rgba(129, 140, 248, ${alpha})`,
            `rgba(34, 197, 94, ${alpha})`,
            `rgba(245, 158, 11, ${alpha})`,
            `rgba(59, 130, 246, ${alpha})`,
            `rgba(236, 72, 153, ${alpha})`,
            `rgba(168, 85, 247, ${alpha})`,
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    },

    /* ==========================================
       MORPHING BACKGROUND
       creates a morphing blob SVG background
       Usage: <div class="morphing-bg"></div>
    ========================================== */

    createMorphingBG(containerId) {
        const container = typeof containerId === "string"
            ? document.getElementById(containerId)
            : containerId;
        if (!container) return;

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("viewBox", "0 0 1200 800");
        svg.style.cssText = "position:absolute;inset:0;width:100%;height:100%;z-index:-1;opacity:0.4;pointer-events:none;";

        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
        filter.setAttribute("id", "morphBlob");
        filter.innerHTML = `
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.5 -0.1" />
        `;
        defs.appendChild(filter);
        svg.appendChild(defs);

        const paths = [];
        const colors = [
            "rgba(79,70,229,0.3)",
            "rgba(99,102,241,0.2)",
            "rgba(129,140,248,0.25)",
            "rgba(168,85,247,0.2)"
        ];

        for (let i = 0; i < 4; i++) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("fill", colors[i]);
            path.setAttribute("filter", "url(#morphBlob)");
            path.style.animation = `morphBlob ${12 + i * 3}s ease-in-out infinite`;
            path.style.animationDelay = `${i * -2}s`;
            svg.appendChild(path);
            paths.push(path);
        }

        container.style.position = "relative";
        container.appendChild(svg);

        // Generate initial positions
        this.updateMorphPaths(paths);
        setInterval(() => this.updateMorphPaths(paths), 6000);
    },

    updateMorphPaths(paths) {
        const points = paths.map(() => {
            return [
                Math.random() * 1200,
                Math.random() * 800,
                Math.random() * 1200,
                Math.random() * 800,
                Math.random() * 1200,
                Math.random() * 800,
                Math.random() * 1200,
                Math.random() * 800
            ];
        });

        paths.forEach((path, i) => {
            const p = points[i];
            path.setAttribute("d", `M${p[0]},${p[1]} C${p[2]},${p[3]} ${p[4]},${p[5]} ${p[6]},${p[7]} C${p[2]+100},${p[3]-50} ${p[4]-80},${p[5]+60} ${p[0]+50},${p[1]-30} Z`);
        });
    },

    /* ==========================================
       SKELETON LOADING - Premium
       Shows shimmer skeleton then reveals content
       Usage: <div data-skeleton="1200">content</div>
    ========================================== */

    initSkeletonLoaders() {
        document.querySelectorAll("[data-skeleton]").forEach(el => {
            const duration = parseInt(el.dataset.skeleton) || 1200;
            const content = el.innerHTML;

            // Generate premium skeleton
            el.innerHTML = this.generateSkeletonHTML(el);
            el.classList.add("skeleton-wrapper");

            // After duration, reveal with a nice transition
            setTimeout(() => {
                el.classList.add("skeleton-loaded");
                setTimeout(() => {
                    el.innerHTML = content;
                    el.classList.remove("skeleton-wrapper", "skeleton-loaded");
                    // Animate new content
                    el.style.animation = "animPremiumFadeUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards";
                }, 400);
            }, duration);
        });
    },

    generateSkeletonHTML(el) {
        const tag = el.tagName.toLowerCase();
        if (tag === "table" || el.closest("table")) {
            return `
                <div class="skeleton-table-premium">
                    <div class="skeleton-row-p"><div class="skeleton-cell-p" style="width:40%"></div><div class="skeleton-cell-p" style="width:25%"></div><div class="skeleton-cell-p" style="width:20%"></div><div class="skeleton-cell-p" style="width:15%"></div></div>
                    <div class="skeleton-row-p"><div class="skeleton-cell-p" style="width:35%"></div><div class="skeleton-cell-p" style="width:30%"></div><div class="skeleton-cell-p" style="width:20%"></div><div class="skeleton-cell-p" style="width:15%"></div></div>
                    <div class="skeleton-row-p"><div class="skeleton-cell-p" style="width:45%"></div><div class="skeleton-cell-p" style="width:20%"></div><div class="skeleton-cell-p" style="width:25%"></div><div class="skeleton-cell-p" style="width:10%"></div></div>
                    <div class="skeleton-row-p"><div class="skeleton-cell-p" style="width:30%"></div><div class="skeleton-cell-p" style="width:35%"></div><div class="skeleton-cell-p" style="width:20%"></div><div class="skeleton-cell-p" style="width:15%"></div></div>
                </div>
            `;
        }
        if (el.classList.contains("skeleton-card")) {
            return `
                <div class="skeleton-card-p">
                    <div class="skeleton-avatar-p"></div>
                    <div class="skeleton-line-p" style="width:75%"></div>
                    <div class="skeleton-line-p" style="width:55%"></div>
                    <div class="skeleton-line-p" style="width:60%"></div>
                </div>
            `;
        }
        return `
            <div class="skeleton-blocks-p">
                <div class="skeleton-line-p" style="width:85%"></div>
                <div class="skeleton-line-p" style="width:65%"></div>
                <div class="skeleton-line-p" style="width:75%"></div>
                <div class="skeleton-line-p" style="width:45%"></div>
            </div>
        `;
    },

    /* ==========================================
       PAGE TRANSITION - Premium
       Smooth morphing transition between pages
       Usage: <div id="pageTransition" class="page-transition"></div>
    ========================================== */

    initPageTransition() {
        const transition = document.getElementById("pageTransition");
        if (!transition) return;

        // On load: smooth enter
        document.addEventListener("DOMContentLoaded", () => {
            transition.classList.add("page-enter");
            setTimeout(() => {
                transition.classList.remove("page-enter");
            }, 600);
        });

        // On link click: smooth exit
        document.addEventListener("click", (e) => {
            const link = e.target.closest("a[href]");
            if (!link) return;

            const href = link.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("javascript") || href === "") return;

            // Don't intercept if target is _blank
            if (link.target === "_blank") return;

            e.preventDefault();
            transition.classList.add("page-leave");
            transition.style.transform = "scaleY(1)";
            transition.style.borderRadius = "0";

            // Add a secondary layer for depth
            const secondLayer = document.createElement("div");
            secondLayer.style.cssText = `
                position: fixed; inset: 0; z-index: 99998;
                background: linear-gradient(135deg, var(--primary-dark), var(--primary));
                transform: scaleY(0); transform-origin: top;
                transition: transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94) 0.15s;
            `;
            document.body.appendChild(secondLayer);
            secondLayer.offsetHeight;
            secondLayer.style.transform = "scaleY(1)";

            setTimeout(() => {
                window.location.href = href;
            }, 500);
        });
    },

    /* ==========================================
       PARALLAX EFFECT
       Subtle parallax on scroll
       Usage: <div class="parallax" data-speed="0.5">
    ========================================== */

    initParallax() {
        const elements = document.querySelectorAll(".parallax");
        if (elements.length === 0) return;

        window.addEventListener("scroll", () => {
            const scrollY = window.pageYOffset;
            elements.forEach(el => {
                const speed = parseFloat(el.dataset.speed) || 0.3;
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    const offset = (scrollY - rect.top) * speed;
                    el.style.transform = `translateY(${offset * 0.1}px)`;
                }
            });
        }, { passive: true });
    },

    /* ==========================================
       CONFETTI CELEBRATION
       Usage: Animator.confetti()
    ========================================== */

    confetti(count = 60) {
        const container = document.createElement("div");
        container.style.cssText = `
            position: fixed; inset: 0; z-index: 99999;
            pointer-events: none; overflow: hidden;
        `;
        document.body.appendChild(container);

        const colors = ["#4f46e5", "#22c55e", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899", "#a855f7", "#06b6d4"];

        for (let i = 0; i < count; i++) {
            const piece = document.createElement("div");
            const size = Math.random() * 8 + 4;
            const isCircle = Math.random() > 0.5;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const startX = Math.random() * 100;
            const duration = 2 + Math.random() * 3;
            const delay = Math.random() * 0.5;
            const rotation = Math.random() * 720;
            const xDrift = (Math.random() - 0.5) * 200;

            piece.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${isCircle ? size : size * 2}px;
                background: ${color};
                border-radius: ${isCircle ? "50%" : "2px"};
                left: ${startX}%;
                top: -20px;
                opacity: 0;
                animation: confettiFall ${duration}s ease-in ${delay}s forwards;
                --x-drift: ${xDrift}px;
                --rotation: ${rotation}deg;
            `;

            container.appendChild(piece);
        }

        setTimeout(() => {
            container.remove();
        }, 5000);
    },

    /* ==========================================
       GLOW BORDER ANIMATION
       Usage: Animator.glowBorder(elementId)
    ========================================== */

    glowBorder(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("glow-border");
        setTimeout(() => el.classList.remove("glow-border"), 2000);
    },

    /* ==========================================
       AUTO ANIMATE
       Automatically animate elements with data attributes
    ========================================== */

    autoAnimate() {
        // Typewriter
        document.querySelectorAll("[data-typewriter]").forEach(el => {
            const text = el.dataset.typewriter || el.textContent;
            const speed = parseInt(el.dataset.typewriterSpeed) || 50;
            this.typeWriter(el, text, speed);
        });

        // Particles
        this.initParticles();

        // Morphing BG
        document.querySelectorAll(".morphing-bg").forEach(el => {
            this.createMorphingBG(el);
        });
    },

    /* ==========================================
       UTILITY METHODS
    ========================================== */

    scrollTo(id, offset = 0) {
        const el = typeof id === "string" ? document.getElementById(id) : id;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top, behavior: "smooth" });
    },

    shake(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("anim-shake");
        setTimeout(() => el.classList.remove("anim-shake"), 500);
    },

    bounce(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("anim-bounce");
        setTimeout(() => el.classList.remove("anim-bounce"), 800);
    },

    flash(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("anim-flash");
        setTimeout(() => el.classList.remove("anim-flash"), 800);
    },

    heartbeat(id) {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("anim-heartbeat");
        setTimeout(() => el.classList.remove("anim-heartbeat"), 1000);
    }
};

/* ==========================================
   AUTO-INITIALIZE ON DOM READY
========================================= */

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        Animator.init();
        window.Animator = Animator;
    }, 100);
});
