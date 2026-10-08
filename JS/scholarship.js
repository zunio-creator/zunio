/* =====================================================
   ZUNIO SCHOLARSHIP PAGE
===================================================== */


/* =====================================================
   SCROLL REVEAL
===================================================== */

const revealElements =
    document.querySelectorAll(".reveal");

const revealObserver =
    new IntersectionObserver(
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
   SEARCH + FILTER
===================================================== */

const searchInput =
    document.getElementById("scholarshipSearch");

const levelFilter =
    document.getElementById("levelFilter");

const fundingFilter =
    document.getElementById("fundingFilter");

const scholarshipCards =
    document.querySelectorAll(".scholarship-card");

const noResults =
    document.getElementById("noResults");


function filterScholarships() {

    const search =
        searchInput.value
            .toLowerCase()
            .trim();

    const selectedLevel =
        levelFilter.value;

    const selectedFunding =
        fundingFilter.value;

    let visibleCount = 0;


    scholarshipCards.forEach((card) => {

        const name =
            card.dataset.name.toLowerCase();

        const level =
            card.dataset.level;

        const funding =
            card.dataset.funding;


        const matchesSearch =
            name.includes(search);

        const matchesLevel =
            selectedLevel === "all" ||
            level === selectedLevel;

        const matchesFunding =
            selectedFunding === "all" ||
            funding === selectedFunding;


        if (
            matchesSearch &&
            matchesLevel &&
            matchesFunding
        ) {

            card.style.display = "";

            visibleCount++;

        } else {

            card.style.display = "none";

        }

    });


    if (visibleCount === 0) {

        noResults.style.display = "block";

    } else {

        noResults.style.display = "none";

    }

}


searchInput.addEventListener(
    "input",
    filterScholarships
);

levelFilter.addEventListener(
    "change",
    filterScholarships
);

fundingFilter.addEventListener(
    "change",
    filterScholarships
);



/* =====================================================
   BOOKMARK
===================================================== */

const bookmarks =
    document.querySelectorAll(".bookmark");


bookmarks.forEach((bookmark) => {

    bookmark.addEventListener("click", () => {

        bookmark.classList.toggle("saved");

        if (bookmark.classList.contains("saved")) {

            bookmark.textContent = "♥";

        } else {

            bookmark.textContent = "♡";

        }

    });

});



/* =====================================================
   SMOOTH ANCHOR LINKS
===================================================== */

document.querySelectorAll(
    'a[href^="#"]'
).forEach((link) => {

    link.addEventListener(
        "click",
        function (event) {

            const targetId =
                this.getAttribute("href");

            if (targetId === "#") {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        }
    );

});