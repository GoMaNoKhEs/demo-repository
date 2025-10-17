// Fonction pour redémarrer le tour d'onboarding
export const restartOnboardingTour = () => {
  localStorage.removeItem('hasSeenOnboarding');
  window.location.reload();
};
