import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Spinner } from './Spinner';

afterEach(cleanup);

describe('Spinner', () => {
  it('is hidden from assistive technology when decorative', () => {
    const { container } = render(<Spinner />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(container.firstElementChild?.getAttribute('role')).toBeNull();
  });

  it('announces an optional loading label as a status', () => {
    render(<Spinner label="Loading results" size="lg" />);
    expect(screen.getByRole('status', { name: 'Loading results' }).getAttribute('data-size')).toBe('lg');
  });

  it('renders the selected three-dot variant', () => {
    const { container } = render(<Spinner variant="dots" />);
    expect(container.querySelectorAll('.prava-spinner__dots span')).toHaveLength(3);
    expect(container.firstElementChild?.getAttribute('data-variant')).toBe('dots');
  });

  it('supports the bars variant and a custom CSS color', () => {
    const { container } = render(<Spinner variant="bars" color="var(--custom-spinner-color)" />);
    expect(container.querySelectorAll('.prava-spinner__bars span')).toHaveLength(3);
    expect(container.firstElementChild?.getAttribute('style')).toContain('var(--custom-spinner-color)');
  });

  it('supports additional indicator variants and semantic themes', () => {
    const { container, rerender } = render(<Spinner variant="pulse" theme="success" />);
    expect(container.querySelector('.prava-spinner__pulse')).toBeTruthy();
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe('success');
    rerender(<Spinner variant="bounce" theme="info" />);
    expect(container.querySelectorAll('.prava-spinner__bounce span')).toHaveLength(3);
    expect(container.firstElementChild?.getAttribute('data-theme')).toBe('info');
  });

  it('forwards native span attributes and customization', () => {
    render(<Spinner className="custom" title="Please wait" data-testid="spinner" />);
    expect(screen.getByTestId('spinner').className).toContain('custom');
    expect(screen.getByTitle('Please wait')).toBeTruthy();
  });
});
