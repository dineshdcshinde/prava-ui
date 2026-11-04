/// <reference types="vite/client" />
import { createElement } from 'react';
import type { Preview } from '@storybook/react-vite';
import { PravaProvider } from '../src/components/provider';
import './preview.css';
import '../src/styles/index.css';

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Prava theme',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark', 'system'],
        dynamicTitle: true,
      },
    },
    direction: {
      description: 'Text direction',
      toolbar: {
        title: 'Direction',
        icon: 'transfer',
        items: ['ltr', 'rtl'],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'light', direction: 'ltr' },
  decorators: [
    (Story, { globals }) => {
      // The canvas background lives on body, outside the provider subtree.
      document.body.setAttribute('data-prava-theme', globals.theme);
      return createElement(PravaProvider, {
        theme: globals.theme,
        direction: globals.direction,
        children: createElement(Story),
      });
    },
  ],
  parameters: {
    options: {
      storySort: {
        order: ['Overview', 'Foundations', 'Actions', 'Forms', 'Display', 'Feedback', 'Overlays', 'Navigation', 'Layout'],
      },
    },
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    a11y: { test: 'todo' },
  },
};

export default preview;
