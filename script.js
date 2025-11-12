<script>
// Smoothly fade sections into view on scroll
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, observerOptions);

document.querySelectorAll('section').forEach(section => {
  observer.observe(section);
});

// Fade-in animation CSS
const style = document.createElement('style');
style.innerHTML = `
  section {
    opacity: 0;
    transform: translateY(15px);
    transition: opacity 0.6s ease, transform 0.6s ease;
  }
  section.visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// Collapsible sections (keep from previous version)
document.querySelectorAll(".toggle-btn").forEach(title => {
  title.addEventListener("click", () => {
    const section = title.parentElement;
    section.classList.toggle("collapsed");
    title.textContent = section.classList.contains("collapsed")
      ? title.textContent.replace("▾", "▸")
      : title.textContent.replace("▸", "▾");
  });
});

// --- PDF generation (single-page compact version) ---
document.getElementById("download-btn")?.addEventListener("click", () => {
  // Clone content
  const content = document.getElementById("profile-content").cloneNode(true);

  // Keep only 3 entries per section
  content.querySelectorAll("section").forEach(section => {
    const entries = section.querySelectorAll("div:not(:has(h2)), ul li");
    entries.forEach((el, i) => i >= 3 && el.remove());
  });

  // Compact layout for single-page PDF
  content.style.transform = "scale(0.85)";
  content.style.transformOrigin = "top left";
  content.style.padding = "10px";
  content.style.width = "100%";
  content.style.lineHeight = "1.3";

  // PDF options — single page, higher scale for readability
  const opt = {
    margin: 0.25,
    filename: "Daniela-Picao-Portfolio.pdf",
    image: { type: "jpeg", quality: 1 },
    html2canvas: {
      scale: 3, // sharper rendering
      scrollY: 0
    },
    jsPDF: {
      unit: "in",
      format: "a4",
      orientation: "portrait"
    },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] }
  };

  // Generate the PDF
  html2pdf().from(content).set(opt).save();
});

</script>
