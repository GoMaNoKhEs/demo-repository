import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMediaQuery } from '../../hooks/useMediaQuery';

describe('useMediaQuery', () => {
  it('should return initial value', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px)'));
    
    expect(typeof result.current).toBe('boolean');
  });

  it('should handle mobile query', () => {
    const { result } = renderHook(() => useMediaQuery('(max-width: 599px)'));
    
    expect(typeof result.current).toBe('boolean');
  });

  it('should handle tablet query', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 600px) and (max-width: 1023px)'));
    
    expect(typeof result.current).toBe('boolean');
  });

  it('should handle desktop query', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 1024px)'));
    
    expect(typeof result.current).toBe('boolean');
  });
});
