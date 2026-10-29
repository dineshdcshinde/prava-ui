import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../components/badge';
import { Button } from '../components/button';

const colorTokens = ['canvas', 'surface', 'surface-hover', 'surface-raised', 'text', 'text-muted', 'border', 'primary', 'primary-container', 'success', 'warning', 'danger', 'danger-container', 'info', 'focus'];
const badgeTones = ['primary', 'success', 'warning', 'danger', 'info'] as const;

function ThemePreview({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <section
      data-prava-theme={theme}
      aria-label={`${theme} theme preview`}
      style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', color: 'var(--prava-color-text)', background: 'var(--prava-color-canvas)', border: '1px solid var(--prava-color-border)', borderRadius: 'var(--prava-radius-card)' }}
    >
      <div>
        <h2 style={{ margin: 0 }}>{theme === 'light' ? 'Light' : 'Dark'} theme</h2>
        <p style={{ color: 'var(--prava-color-text-muted)' }}>Blue actions, semantic badges, shared tokens.</p>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
        <Button>Primary action</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.75rem', paddingBlock: '.5rem' }}>
        {badgeTones.map((tone) => <Badge key={tone} tone={tone} content={tone} placement="top-right"><span style={{ padding: '.5rem', background: 'var(--prava-color-surface)', borderRadius: 'var(--prava-radius-control)' }}>Inbox</span></Badge>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(8.5rem, 1fr))', gap: '.5rem' }}>
        {colorTokens.map((token) => (
          <div key={token} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', minWidth: 0 }}>
            <span aria-hidden="true" style={{ flex: '0 0 1.25rem', height: '1.25rem', background: `var(--prava-color-${token})`, border: '1px solid var(--prava-color-border)', borderRadius: '.25rem' }} />
            <code style={{ overflowWrap: 'anywhere', fontSize: '.75rem' }}>{token}</code>
          </div>
        ))}
      </div>
    </section>
  );
}

function FoundationsPage() {
  return (
    <main style={{ display: 'grid', gap: '1.5rem', padding: '1.5rem', fontFamily: 'inherit' }}>
      <header>
        <h1>Prava UI foundations</h1>
        <p>Near-white light surfaces and layered obsidian dark surfaces with clear blue actions.</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 32rem), 1fr))', gap: '1rem' }}>
        <ThemePreview theme="light" />
        <ThemePreview theme="dark" />
      </div>
    </main>
  );
}

const meta = { title: 'Foundations/Overview', component: FoundationsPage } satisfies Meta<typeof FoundationsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
