/* =====================================================
   ZUNIO POLICY PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const policyCards = document.querySelectorAll(".policy-card");

    /* ================================================
       SCROLL REVEAL
    ================================================ */

    const revealCards = () => {

        const windowHeight = window.innerHeight;

        policyCards.forEach((card) => {

            const cardTop = card.getBoundingClientRect().top;

            if (cardTop < windowHeight - 80) {
                card.classList.add("show");
            }

        });

    };

    window.addEventListener("scroll", revealCards);

    revealCards();


    /* ================================================
       CARD HOVER EFFECT
    ================================================ */

    policyCards.forEach((card) => {

        card.addEventListener("mouseenter", () => {
            card.style.transform = "translateY(-5px)";
        });

        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });

    });

});