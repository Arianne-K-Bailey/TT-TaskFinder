export function loadFooter() {
  const target = document.getElementById("footer");

  fetch("/public/components/footer.html")
    .then(res => res.text())
    .then(html => {
      target.innerHTML = html;
    })
    .catch(err => console.error("Footer load error:", err));

 document.getElementById("newsletter-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const emailInput = this.querySelector("input");
  const email = emailInput.value.trim();

  if (!email) return;

  // basic UX feedback (no fake backend nonsense)
  alert("Subscribed with: " + email);

  emailInput.value = "";
});
}