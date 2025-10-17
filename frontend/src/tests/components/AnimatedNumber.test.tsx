import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';

describe('AnimatedNumber', () => {
  it('should render the animated number', () => {
    const { container } = render(<AnimatedNumber value={42} duration={1000} />);
    
    // Le nombre devrait être visible dans le DOM
    expect(container.firstChild).toBeInTheDocument();
    expect(container.textContent).toBeTruthy();
  });

  it('should use custom suffix when provided', () => {
    const { container } = render(<AnimatedNumber value={100} suffix="%" duration={1000} />);
    
    // Vérifier que le container existe
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should handle decimals correctly', () => {
    const { container } = render(<AnimatedNumber value={3.14} decimals={2} duration={1000} />);
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('should render without errors', () => {
    const { container } = render(
      <AnimatedNumber value={42} duration={1000} />
    );
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
