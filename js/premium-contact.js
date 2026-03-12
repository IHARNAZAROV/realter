(() => {
  const card = document.getElementById("premiumContactCard");
  if (!card) return;

  const particlesRoot = document.getElementById("premiumContactParticles");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const createParticles = () => {
    if (!particlesRoot || reducedMotion) return;

    const particleCount = window.innerWidth < 768 ? 10 : 18;
    particlesRoot.innerHTML = "";

    for (let i = 0; i < particleCount; i += 1) {
      const particle = document.createElement("span");
      particle.className = "premium-contact-particle";
      const size = (Math.random() * 5 + 3).toFixed(2);
      const left = (Math.random() * 100).toFixed(2);
      const top = (Math.random() * 100).toFixed(2);
      const duration = (Math.random() * 10 + 12).toFixed(2);
      const delay = (Math.random() * -20).toFixed(2);
      const drift = `${(Math.random() * 36 - 18).toFixed(2)}px`;

      particle.style.setProperty("--size", `${size}px`);
      particle.style.left = `${left}%`;
      particle.style.top = `${top}%`;
      particle.style.setProperty("--dur", `${duration}s`);
      particle.style.setProperty("--delay", `${delay}s`);
      particle.style.setProperty("--x-drift", drift);
      particlesRoot.appendChild(particle);
    }
  };

  createParticles();
  window.addEventListener("resize", createParticles, { passive: true });

  if (reducedMotion || window.innerWidth < 768) {
    card.style.setProperty("--pc-photo-mouse-x", "0px");
    card.style.setProperty("--pc-photo-mouse-y", "0px");
    card.style.setProperty("--pc-photo-float-x", "0px");
    card.style.setProperty("--pc-photo-float-y", "0px");
    return;
  }

  const layeredElements = card.querySelectorAll("[data-depth]:not(.premium-contact-figure)");
  let rafId = null;

  let photoFloatFrame = null;
  const animatePhoto = () => {
    const t = performance.now() * 0.001;
    const floatX = Math.sin(t * 1.1) * 8;
    const floatY = Math.sin(t * 0.8) * 4;
    card.style.setProperty("--pc-photo-float-x", `${floatX.toFixed(2)}px`);
    card.style.setProperty("--pc-photo-float-y", `${floatY.toFixed(2)}px`);
    photoFloatFrame = requestAnimationFrame(animatePhoto);
  };
  photoFloatFrame = requestAnimationFrame(animatePhoto);

  const updateEffect = (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    const tiltY = (x - 0.5) * 5;
    const tiltX = (0.5 - y) * 4;

    card.style.setProperty("--pc-tilt-x", `${tiltX.toFixed(2)}deg`);
    card.style.setProperty("--pc-tilt-y", `${tiltY.toFixed(2)}deg`);
    card.style.setProperty("--pc-mouse-x", `${(x * 100).toFixed(2)}%`);
    card.style.setProperty("--pc-mouse-y", `${(y * 100).toFixed(2)}%`);

    layeredElements.forEach((element) => {
      const depth = Number(element.dataset.depth || 0.4);
      const moveX = (x - 0.5) * 18 * depth;
      const moveY = (y - 0.5) * 14 * depth;
      element.style.transform = `translate3d(${moveX.toFixed(2)}px, ${moveY.toFixed(2)}px, 0)`;
    });

    card.style.setProperty("--pc-photo-mouse-x", `${((x - 0.5) * 16).toFixed(2)}px`);
    card.style.setProperty("--pc-photo-mouse-y", `${((y - 0.5) * 8).toFixed(2)}px`);
  };

  card.addEventListener("mousemove", (event) => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => updateEffect(event));
  });

  card.addEventListener("mouseleave", () => {
    card.style.setProperty("--pc-tilt-x", "0deg");
    card.style.setProperty("--pc-tilt-y", "0deg");
    card.style.setProperty("--pc-mouse-x", "50%");
    card.style.setProperty("--pc-mouse-y", "50%");
    card.style.setProperty("--pc-photo-mouse-x", "0px");
    card.style.setProperty("--pc-photo-mouse-y", "0px");

    layeredElements.forEach((element) => {
      element.style.transform = "translate3d(0, 0, 0)";
    });
  });
})();
