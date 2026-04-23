import { createPaletteChannel } from 'minimal-shared/utils';

import type { ThemeOptions } from './types';

// ----------------------------------------------------------------------

export const themeOverrides: ThemeOptions = {
  colorSchemes: {
    light: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FDEEEE',
          light: '#F7CACA',
          main: '#F0A8A8',
          dark: '#D47979',
          darker: '#A14A4A',
          contrastText: '#1C252E',
        }),
      },
    },
    dark: {
      palette: {
        primary: createPaletteChannel({
          lighter: '#FDEEEE',
          light: '#F7CACA',
          main: '#F0A8A8',
          dark: '#D47979',
          darker: '#A14A4A',
          contrastText: '#1C252E',
        }),
      },
    },
  },
};
