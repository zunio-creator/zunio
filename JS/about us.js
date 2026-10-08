/* =========================================
   ZUNIO ABOUT PAGE JS
========================================= */


/* =========================================
   SCROLL REVEAL
========================================= */

const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
    (entries) => {

        entries.forEach((entry) => {

            if (entry.isIntersecting) {

                entry.target.classList.add("show");

                revealObserver.unobserve(entry.target);

            }

        });

    },
    {
        threshold: 0.15
    }
);


revealElements.forEach((element) => {
    revealObserver.observe(element);
});


/* =========================================
   COUNTER ANIMATION
========================================= */

const counters = document.querySelectorAll(".counter");

let counterStarted = false;


function startCounters() {

    if (counterStarted) return;

    counterStarted = true;

    counters.forEach((counter) => {

        const target = Number(
            counter.getAttribute("data-target")
        );

        let current = 0;

        const duration = 1600;

        const startTime = performance.now();


        function updateCounter(currentTime) {

            const elapsed = currentTime - startTime;

            const progress = Math.min(
                elapsed / duration,
                1
            );

            const easeOut =
                1 - Math.pow(1 - progress, 3);

            current = Math.floor(
                target * easeOut
            );

            counter.textContent = current;


            if (progress < 1) {

                requestAnimationFrame(
                    updateCounter
                );

            } else {

                counter.textContent = target;

            }

        }


        requestAnimationFrame(updateCounter);

    });

}


/* =========================================
   COUNTER OBSERVER
========================================= */

const statsSection =
    document.querySelector(".stats-section");


if (statsSection) {

    const statsObserver =
        new IntersectionObserver(
            (entries) => {

                entries.forEach((entry) => {

                    if (entry.isIntersecting) {

                        startCounters();

                        statsObserver.unobserve(
                            entry.target
                        );

                    }

                });

            },
            {
                threshold: 0.35
            }
        );


    statsObserver.observe(statsSection);

}


/* =========================================
   CARD 3D EFFECT
========================================= */

const cards = document.querySelectorAll(
    ".value-card, .stat-card"
);


cards.forEach((card) => {

    card.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                card.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;


            const centerX =
                rect.width / 2;

            const centerY =
                rect.height / 2;


            const rotateX =
                ((y - centerY) / centerY) * -3;

            const rotateY =
                ((x - centerX) / centerX) * 3;


            card.style.transform = `
                perspective(800px)
                rotateX(${rotateX}deg)
                rotateY(${rotateY}deg)
                translateY(-7px)
            `;

        }
    );


    card.addEventListener(
        "mouseleave",
        () => {

            card.style.transform =
                "translateY(0)";

        }
    );

});


/* =========================================
   HERO ORB MOUSE MOVEMENT
========================================= */

const heroVisual =
    document.querySelector(".hero-visual");

const glassOrb =
    document.querySelector(".glass-orb");


if (heroVisual && glassOrb) {

    heroVisual.addEventListener(
        "mousemove",
        (event) => {

            const rect =
                heroVisual.getBoundingClientRect();

            const x =
                event.clientX - rect.left;

            const y =
                event.clientY - rect.top;


            const centerX =
                rect.width / 2;

            const centerY =
                rect.height / 2;


            const moveX =
                ((x - centerX) / centerX) * 10;

            const moveY =
                ((y - centerY) / centerY) * 10;


            glassOrb.style.transform = `
                translate(${moveX}px, ${moveY}px)
            `;

        }
    );


    heroVisual.addEventListener(
        "mouseleave",
        () => {

            glassOrb.style.transform =
                "translate(0, 0)";

        }
    );

}