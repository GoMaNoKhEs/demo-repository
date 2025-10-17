import { useEffect, useCallback } from 'react';

/**
 * Hook pour gérer la navigation clavier dans l'application
 * Gère les raccourcis globaux comme Escape pour fermer les modals/drawers
 */

export interface UseKeyboardNavigationOptions {
  /**
   * Callback appelé quand Escape est pressé
   */
  onEscape?: () => void;
  
  /**
   * Callback appelé quand Enter est pressé
   */
  onEnter?: () => void;
  
  /**
   * Si true, les handlers sont actifs
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Si true, empêche le comportement par défaut du navigateur
   * @default false
   */
  preventDefault?: boolean;
}

export const useKeyboardNavigation = (options: UseKeyboardNavigationOptions = {}) => {
  const {
    onEscape,
    onEnter,
    enabled = true,
    preventDefault = false,
  } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Escape key
      if (event.key === 'Escape' && onEscape) {
        if (preventDefault) {
          event.preventDefault();
        }
        onEscape();
        return;
      }

      // Enter key
      if (event.key === 'Enter' && onEnter) {
        if (preventDefault) {
          event.preventDefault();
        }
        onEnter();
        return;
      }
    },
    [enabled, onEscape, onEnter, preventDefault]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, handleKeyDown]);
};

/**
 * Hook pour gérer le focus trap dans les modals/drawers
 * Empêche le focus de sortir du container quand Tab est pressé
 */
export const useFocusTrap = (
  containerRef: React.RefObject<HTMLElement>,
  isActive: boolean
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    
    // Éléments focusables
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(focusableSelectors)
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift + Tab sur premier élément → focus dernier élément
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      // Tab sur dernier élément → focus premier élément
      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
        return;
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus premier élément au montage
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(focusableSelectors)
    );
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [containerRef, isActive]);
};

/**
 * Hook pour ajouter un outline visible sur focus
 * Utilise :focus-visible CSS pour distinguer focus clavier vs souris
 */
export const useFocusVisible = () => {
  useEffect(() => {
    // Ajouter une classe globale pour améliorer le focus visible
    const style = document.createElement('style');
    style.textContent = `
      /* Focus visible sur tous les éléments interactifs */
      *:focus-visible {
        outline: 3px solid #1976d2 !important;
        outline-offset: 2px !important;
        border-radius: 4px;
      }
      
      /* Focus visible pour boutons MUI */
      .MuiButton-root:focus-visible,
      .MuiIconButton-root:focus-visible {
        outline: 3px solid #1976d2 !important;
        outline-offset: 2px !important;
      }
      
      /* Focus visible pour inputs */
      .MuiInputBase-root:focus-within {
        outline: 2px solid #1976d2 !important;
        outline-offset: 2px !important;
      }
      
      /* Focus visible pour accordions */
      .MuiAccordionSummary-root:focus-visible {
        outline: 3px solid #1976d2 !important;
        outline-offset: -2px !important;
      }
      
      /* Pas de outline sur focus souris (seulement clavier) */
      *:focus:not(:focus-visible) {
        outline: none !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
};
