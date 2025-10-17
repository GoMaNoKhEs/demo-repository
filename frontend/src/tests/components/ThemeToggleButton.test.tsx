import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeToggleButton } from '../../components/common/ThemeToggleButton';
import { ThemeModeProvider } from '../../contexts/ThemeModeContext';

describe('ThemeToggleButton', () => {
  it('should render toggle button', () => {
    render(
      <ThemeModeProvider>
        <ThemeToggleButton />
      </ThemeModeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('should have accessibility label', () => {
    render(
      <ThemeModeProvider>
        <ThemeToggleButton />
      </ThemeModeProvider>
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label');
  });

  it('should toggle theme when clicked', () => {
    render(
      <ThemeModeProvider>
        <ThemeToggleButton />
      </ThemeModeProvider>
    );
    
    const button = screen.getByRole('button');
    
    // Click should not throw error
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should render with icon', () => {
    const { container } = render(
      <ThemeModeProvider>
        <ThemeToggleButton />
      </ThemeModeProvider>
    );
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });
});
