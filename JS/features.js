/* =====================================================
   ZUNIO FEATURES PAGE
===================================================== */


/* =====================================================
   SCROLL REVEAL
===================================================== */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries, observer) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                observer.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.12
    }
);


revealElements.forEach((element) => {
    revealObserver.observe(element);
});


/* =====================================================
   SMOOTH FEATURE LINK
===================================================== */

document.querySelectorAll('a[href^="#"]').forEach((link) => {

    link.addEventListener("click", function (event) {

        const targetId = this.getAttribute("href");

        if (targetId === "#") return;

        const target = document.querySelector(targetId);

        if (!target) return;

        event.preventDefault();

        target.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });

});


/* =====================================================
   FEATURE CARD MOUSE EFFECT
===================================================== */

const cards = document.querySelectorAll(".feature-card");

cards.forEach((card) => {

    card.addEventListener("mousemove", (event) => {

        if (window.innerWidth <= 900) return;

        const rect = card.getBoundingClientRect();

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const rotateX =
            ((y / rect.height) - 0.5) * -4;

        const rotateY =
            ((x / rect.width) - 0.5) * 4;

        card.style.transform =
            `translateY(-8px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

    });


    card.addEventListener("mouseleave", () => {

        card.style.transform = "";

    });

});


/* =====================================================
   PARALLAX HERO ORB
===================================================== */

const heroVisual =
    document.querySelector(".hero-visual");

if (heroVisual) {

    heroVisual.addEventListener("mousemove", (event) => {

        if (window.innerWidth <= 900) return;

        const rect =
            heroVisual.getBoundingClientRect();

        const x =
            (event.clientX - rect.left) / rect.width - 0.5;

        const y =
            (event.clientY - rect.top) / rect.height - 0.5;

        const orb =
            document.querySelector(".feature-orb");

        if (orb) {

            orb.style.transform =
                `translate(${x * 12}px, ${y * 12}px)`;

        }

    });


    heroVisual.addEventListener("mouseleave", () => {

        const orb =
            document.querySelector(".feature-orb");

        if (orb) {

            orb.style.transform = "";

        }

    });

}


/* =====================================================
   CURRENT YEAR
===================================================== */

const footerText =
    document.querySelector(".footer p");

if (footerText) {

    const year =
        new Date().getFullYear();

    footerText.innerHTML =
        `© ${year} Zunio. All rights reserved.`;

}