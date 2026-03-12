(() => {
  const card = document.getElementById("simpleContactCard");
  if (!card) return;

  const isMobile = window.matchMedia("(max-width: 991px)").matches;
  if (isMobile) {
    card.style.setProperty("--photo-x", "0px");
    return;
  }

  let mouseOffset = 0;

  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    mouseOffset = (x - 0.5) * 42;
  });

  card.addEventListener("mouseleave", () => {
    mouseOffset = 0;
  });

  const animate = (time) => {
    const t = time * 0.001;
    const autoOffset = Math.sin(t * 1.15) * 44;
    card.style.setProperty("--photo-x", `${(autoOffset + mouseOffset).toFixed(2)}px`);
    requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
})();
