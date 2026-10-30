import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from './Avatar';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  args: { firstName: 'Fatima', lastName: 'Lovelace' },
} satisfies Meta<typeof Avatar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Initials: Story = {};
export const Image: Story = { args: { src: 'https://i.pravatar.cc/96?img=47' } };
export const Sizes: Story = {
  render: (args) => <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>{(['sm', 'md', 'lg'] as const).map((size) => <Avatar {...args} key={size} size={size} />)}</div>,
};
export const RTL: Story = { render: (args) => <div dir="rtl"><Avatar {...args} /></div> };
