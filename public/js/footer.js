export function loadFooter() {
  const target = document.getElementById("footer");

  fetch("./components/footer.html")
    .then(res => res.text())
    .then(html => {
      target.innerHTML = html;

      // Now the HTML is in the DOM, we can safely query the form
      const form = document.getElementById("newsletter-form");
      if (form) {
        form.addEventListener("submit", function (e) {
          e.preventDefault();

          const emailInput = this.querySelector("input");
          const email = emailInput.value.trim();

          if (!email) return;

          alert("Subscribed with: " + email);

          emailInput.value = "";
        });
      }
    })
    .catch(err => console.error("Footer load error:", err));
}