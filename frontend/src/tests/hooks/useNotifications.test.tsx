import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SnackbarProvider } from 'notistack';
import { useNotifications } from '../../hooks/useNotifications';

describe('useNotifications', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SnackbarProvider>{children}</SnackbarProvider>
  );

  it('should provide notification functions', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(result.current).toHaveProperty('success');
    expect(result.current).toHaveProperty('error');
    expect(result.current).toHaveProperty('warning');
    expect(result.current).toHaveProperty('info');
  });

  it('should have success function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(typeof result.current.success).toBe('function');
  });

  it('should have error function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(typeof result.current.error).toBe('function');
  });

  it('should have warning function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(typeof result.current.warning).toBe('function');
  });

  it('should have info function', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(typeof result.current.info).toBe('function');
  });

  it('should not throw when calling notification methods', () => {
    const { result } = renderHook(() => useNotifications(), { wrapper });
    
    expect(() => result.current.success('Test message')).not.toThrow();
    expect(() => result.current.info('Info message')).not.toThrow();
  });
});
