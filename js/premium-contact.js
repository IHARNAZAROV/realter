(() => {
  const card = document.getElementById("premiumContactCard");
  if (!card) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isMobile = window.matchMedia("(max-width: 991px)").matches;

  if (reducedMotion || isMobile) {
    card.style.setProperty("--pc-photo-x", "0px");
    return;
  }

  let mouseOffset = 0;

  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    mouseOffset = (x - 0.5) * 14;
  });

  card.addEventListener("mouseleave", () => {
    mouseOffset = 0;
  });

  const animate = (time) => {
    const t = time * 0.001;
    const autoOffset = Math.sin(t * 1.2) * 16;
    const totalX = autoOffset + mouseOffset;
    card.style.setProperty("--pc-photo-x", `${totalX.toFixed(2)}px`);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
})();
