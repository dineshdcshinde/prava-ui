import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Button } from './Button';

const PlusIcon = () => <svg data-testid="plus-icon" />;

afterEach(cleanup);

describe('Button icons', () => {
  it('renders decorative icons on either side of button text', () => {
    render(<Button leftIcon={<PlusIcon />} rightIcon={<PlusIcon />}>Add item</Button>);
    expect(screen.getByRole('button', { name: 'Add item' })).toBeTruthy();
    expect(screen.getAllByTestId('plus-icon')).toHaveLength(2);
  });

  it('renders an accessible icon-only button', () => {
    render(<Button type="icon" aria-label="Add item" leftIcon={<PlusIcon />} />);
    expect(screen.getByRole('button', { name: 'Add item' }).getAttribute('data-type')).toBe('icon');
  });
});
