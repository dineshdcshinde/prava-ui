import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Badge } from './Badge';
import { Button } from '../button';

afterEach(cleanup);

describe('Badge', () => {
  it('anchors a non-interactive indicator to its child element', () => {
    render(<Badge tone="success" size="sm" content="3"><Button>Inbox</Button></Badge>);
    const indicator = screen.getByText('3');
    expect(indicator.tagName).toBe('SPAN');
    expect(indicator.getAttribute('data-tone')).toBe('success');
    expect(indicator.getAttribute('data-size')).toBe('sm');
    expect(indicator.getAttribute('data-placement')).toBe('top-right');
    expect(screen.getByRole('button', { name: 'Inbox' })).toBeTruthy();
    expect(indicator.closest('button')).toBeNull();
  });

  it.each(['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const)(
    'places the indicator at the %s corner',
    (placement) => {
      render(<Badge placement={placement} content="3"><Button>Inbox</Button></Badge>);
      expect(screen.getByText('3').getAttribute('data-placement')).toBe(placement);
    },
  );

  it('forwards native span attributes and customization', () => {
    render(<Badge className="custom" title="Status" data-testid="status" content="New"><Button>Updates</Button></Badge>);
    expect(screen.getByTestId('status').className).toContain('custom');
    expect(screen.getByTitle('Status').textContent).toContain('Updates');
    expect(screen.getByText('New')).toBeTruthy();
  });
});
