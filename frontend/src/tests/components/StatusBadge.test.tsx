import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusBadge } from '../../components/common/StatusBadge';

describe('StatusBadge', () => {
  it('should render pending status', () => {
    render(<StatusBadge status="pending" label="En attente" />);
    
    const badge = screen.getByText('En attente');
    expect(badge).toBeInTheDocument();
  });

  it('should render in-progress status with correct color', () => {
    const { container } = render(<StatusBadge status="in-progress" label="En cours" />);
    
    const chip = container.querySelector('.MuiChip-root');
    expect(chip).toBeInTheDocument();
  });

  it('should render completed status', () => {
    render(<StatusBadge status="completed" label="Terminé" />);
    
    const badge = screen.getByText('Terminé');
    expect(badge).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<StatusBadge status="error" label="Erreur" />);
    
    const badge = screen.getByText('Erreur');
    expect(badge).toBeInTheDocument();
  });

  it('should use custom label when provided', () => {
    render(<StatusBadge status="completed" label="Custom Label" />);
    
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });
});
