import confetti from 'canvas-confetti';

/**
 * Déclenche une animation confetti de célébration
 * Utilisé quand le processus est complété avec succès
 */
export const celebrateSuccess = () => {
  const duration = 3000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 50 * (timeLeft / duration);

    // Explosion depuis la gauche
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'], // Couleurs Google
    });

    // Explosion depuis la droite
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'], // Couleurs Google
    });
  }, 250);
};

/**
 * Animation confetti simple (1 explosion)
 * Pour les succès ponctuels
 */
export const miniCelebration = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'], // Couleurs Google
  });
};

/**
 * Animation confetti "fireworks"
 * Pour les succès majeurs
 */
export const fireworksCelebration = () => {
  const duration = 5000;
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'],
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'],
    });

    if (timeLeft < duration / 2) {
      confetti({
        particleCount: 2,
        angle: randomInRange(55, 125),
        spread: randomInRange(50, 70),
        origin: { x: randomInRange(0.3, 0.7), y: randomInRange(0.4, 0.6) },
        colors: ['#4285F4', '#34A853', '#FBBC04', '#EA4335'],
      });
    }
  }, 200);
};
