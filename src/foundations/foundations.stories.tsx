import type { Meta, StoryObj } from '@storybook/react-vite';

function FoundationsPage() {
  return (
    <main style={{ color: 'var(--prava-color-text)', background: 'var(--prava-color-canvas)', padding: '2rem' }}>
      <h1>Prava UI foundations</h1>
      <p>Current direction: calm product surfaces, clear hierarchy, and a confident teal accent. These token values are provisional and will be reviewed as the system grows.</p>
      <section aria-labelledby="colors-heading">
        <h2 id="colors-heading">Semantic colors</h2>
        <ul>
          {['canvas', 'surface', 'surface-hover', 'text', 'text-muted', 'border', 'focus', 'primary', 'primary-hover', 'success', 'warning', 'danger', 'danger-hover', 'info'].map((token) => (
            <li key={token} style={{ paddingBlock: '.25rem' }}>
              <span style={{ display: 'inline-block', width: 20, height: 20, marginInlineEnd: 8, verticalAlign: 'middle', background: `var(--prava-color-${token})`, border: '1px solid var(--prava-color-border)' }} />
              --prava-color-{token}
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Theme</h2>
        <p>Set data-prava-theme="light" or "dark" on the document root. Direction follows inherited dir attributes.</p>
      </section>
    </main>
  );
}

const meta = { title: 'Foundations/Overview', component: FoundationsPage } satisfies Meta<typeof FoundationsPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = {};
