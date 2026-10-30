import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  args: { label: 'Loading' },
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Spinner>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Decorative: Story = { args: { label: undefined } };
export const Sizes: Story = {
  render: (args) => <div style={{ display: 'flex', alignItems: 'end', gap: '1.25rem' }}>{(['sm', 'md', 'lg'] as const).map((size) => <div key={size} style={{ display: 'grid', justifyItems: 'center', gap: '.5rem' }}><Spinner {...args} size={size} /><small>{size}</small></div>)}</div>,
};
export const Dots: Story = { args: { variant: 'dots' } };
export const Bars: Story = { args: { variant: 'bars' } };
export const Pulse: Story = { args: { variant: 'pulse' } };
export const Bounce: Story = { args: { variant: 'bounce' } };
export const Variants: Story = {
  render: (args) => <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>{(['spinner', 'dots', 'bars', 'pulse', 'bounce'] as const).map((variant) => <Spinner {...args} key={variant} variant={variant} />)}</div>,
};
export const Themes: Story = {
  render: (args) => <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>{(['primary', 'neutral', 'success', 'warning', 'danger', 'info'] as const).map((theme) => <Spinner {...args} key={theme} theme={theme} />)}</div>,
};
export const CustomColor: Story = { args: { color: '#7c3aed' } };
export const RTL: Story = { render: (args) => <div dir="rtl"><Spinner {...args} /></div> };
