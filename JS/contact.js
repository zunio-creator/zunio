/* =====================================================
   ZUNIO CONTACT PAGE
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("contactForm");
    const button = form.querySelector(".send-btn");
    const buttonText = button.querySelector("span:first-child");


    form.addEventListener("submit", (event) => {

        event.preventDefault();


        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const subject = document.getElementById("subject").value.trim();
        const message = document.getElementById("message").value.trim();


        if (!name || !email || !subject || !message) {

            alert("Please fill in all fields.");

            return;
        }


        /* Button loading */

        button.disabled = true;

        buttonText.textContent = "Sending...";


        setTimeout(() => {

            buttonText.textContent = "Message Sent ✓";

            button.style.background = "#32a852";


            /* Clear form */

            form.reset();


            setTimeout(() => {

                button.disabled = false;

                buttonText.textContent = "Send Message";

                button.style.background = "";

            }, 2500);


        }, 1000);

    });

});