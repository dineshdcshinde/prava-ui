import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';

afterEach(cleanup);

describe('Avatar', () => {
  it('shows initials and an accessible name when no image is provided', () => {
    render(<Avatar firstName="Fatima" lastName="Lovelace" />);
    expect(screen.getByRole('img', { name: 'Fatima Lovelace' }).textContent).toBe('FL');
  });

  it('shows the image when provided and falls back to initials if it fails', () => {
    render(<Avatar src="person.png" firstName="Fatima" lastName="Lovelace" />);
    const avatar = screen.getByRole('img', { name: 'Fatima Lovelace' });
    expect(avatar.querySelector('img')?.getAttribute('src')).toBe('person.png');
    fireEvent.error(avatar.querySelector('img')!);
    expect(avatar.textContent).toBe('FL');
  });

  it('supports a supplied fallback and decorative semantics', () => {
    const { container } = render(<Avatar fallback="?" size="lg" />);
    expect(container.firstElementChild?.textContent).toBe('?');
    expect(container.firstElementChild?.getAttribute('data-size')).toBe('lg');
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
