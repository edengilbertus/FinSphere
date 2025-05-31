import { createTheme } from '@mui/material/styles';

// Helper function to define the theme based on mode
const getDesignTokens = (mode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light theme colors from InvesAfric
          primary: {
            main: '#6750A4', // --md-sys-color-primary
            contrastText: '#FFFFFF', // --md-sys-color-on-primary
          },
          primaryContainer: '#EADDFF', // --md-sys-color-primary-container
          onPrimaryContainer: '#21005D', // --md-sys-color-on-primary-container
          secondary: {
            main: '#625B71', // --md-sys-color-secondary
            contrastText: '#FFFFFF', // --md-sys-color-on-secondary
          },
          secondaryContainer: '#E8DEF8', // --md-sys-color-secondary-container
          onSecondaryContainer: '#1D192B', // --md-sys-color-on-secondary-container
          tertiary: {
            main: '#7D5260', // --md-sys-color-tertiary
            contrastText: '#FFFFFF', // --md-sys-color-on-tertiary
          },
          tertiaryContainer: '#FFD8E4', // --md-sys-color-tertiary-container
          onTertiaryContainer: '#31111D', // --md-sys-color-on-tertiary-container
          error: {
            main: '#B3261E', // --md-sys-color-error
            contrastText: '#FFFFFF', // --md-sys-color-on-error
          },
          errorContainer: '#F9DEDC', // --md-sys-color-error-container
          onErrorContainer: '#410E0B', // --md-sys-color-on-error-container
          background: {
            default: '#FEF7FF', // --md-sys-color-background
            paper: '#F3EDF7', // --md-sys-color-surface-container (used for cards)
          },
          surface: '#FEF7FF', // --md-sys-color-surface
          onSurface: '#1C1B1F', // --md-sys-color-on-surface
          surfaceVariant: '#E7E0EC', // --md-sys-color-surface-variant
          onSurfaceVariant: '#49454F', // --md-sys-color-on-surface-variant
          outline: '#79747E', // --md-sys-color-outline
          outlineVariant: '#CAC4D0', // --md-sys-color-outline-variant
          text: {
            primary: '#1C1B1F', // --md-sys-color-on-background / on-surface
            secondary: '#49454F', // --md-sys-color-on-surface-variant
          },
          surfaceContainerLowest: '#FFFFFF',
          surfaceContainerLow: '#F7F2FA',
          surfaceContainer: '#F3EDF7',
          surfaceContainerHigh: '#ECE6F0',
          surfaceContainerHighest: '#E6E0E9',
        }
      : {
          // Dark theme colors from InvesAfric
          primary: {
            main: '#D0BCFF', // --md-sys-color-primary
            contrastText: '#381E72', // --md-sys-color-on-primary
          },
          primaryContainer: '#4F378B', // --md-sys-color-primary-container
          onPrimaryContainer: '#EADDFF', // --md-sys-color-on-primary-container
          secondary: {
            main: '#CCC2DC', // --md-sys-color-secondary
            contrastText: '#332D41', // --md-sys-color-on-secondary
          },
          secondaryContainer: '#4A4458', // --md-sys-color-secondary-container
          onSecondaryContainer: '#E8DEF8', // --md-sys-color-on-secondary-container
          tertiary: {
            main: '#EFB8C8', // --md-sys-color-tertiary
            contrastText: '#492532', // --md-sys-color-on-tertiary
          },
          tertiaryContainer: '#633B48', // --md-sys-color-tertiary-container
          onTertiaryContainer: '#FFD8E4', // --md-sys-color-on-tertiary-container
          error: {
            main: '#F2B8B5', // --md-sys-color-error
            contrastText: '#601410', // --md-sys-color-on-error
          },
          errorContainer: '#8C1D18', // --md-sys-color-error-container
          onErrorContainer: '#F9DEDC', // --md-sys-color-on-error-container
          background: {
            default: '#1C1B1F', // --md-sys-color-background
            paper: '#211F26', // --md-sys-color-surface-container (used for cards)
          },
          surface: '#141218', // --md-sys-color-surface
          onSurface: '#E6E0E9', // --md-sys-color-on-surface
          surfaceVariant: '#49454F', // --md-sys-color-surface-variant
          onSurfaceVariant: '#CAC4D0', // --md-sys-color-on-surface-variant
          outline: '#938F99', // --md-sys-color-outline
          outlineVariant: '#49454F', // --md-sys-color-outline-variant
          text: {
            primary: '#E6E1E5', // --md-sys-color-on-background / on-surface
            secondary: '#CAC4D0', // --md-sys-color-on-surface-variant
          },
          surfaceContainerLowest: '#0F0D13',
          surfaceContainerLow: '#1D1B20',
          surfaceContainer: '#211F26',
          surfaceContainerHigh: '#2B2930',
          surfaceContainerHighest: '#36343B',
        }),
  },
  shape: {
    borderRadius: 16, // Consistent with InvesAfric .card-base (16px)
  },
  typography: {
    fontFamily: '"Google Sans", Roboto, Arial, sans-serif', // Added Google Sans
    button: {
      textTransform: 'none',
      fontWeight: 500, // Material You often uses 500 for buttons
      // borderRadius: 16, // Handled by shape.borderRadius or component override
    },
    h1: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 700 },
    h2: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 700 },
    h3: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 500 },
    h4: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 500, letterSpacing: '0px' },
    h5: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 500 },
    h6: { fontFamily: '"Google Sans", Roboto, sans-serif', fontWeight: 500 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          borderRadius: theme.shape.borderRadius * 1.5, // Pill shape often 24px or more
          minHeight: 48, // Keep min height
          fontWeight: 500,
          // boxShadow: 'none', // Material You buttons often have less or no shadow by default
          ...(ownerState.variant === 'contained' && {
             boxShadow: `0 1px 2px 0 ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.3)'}`,
             '&:hover': {
                boxShadow: `0 2px 4px 0 ${theme.palette.mode === 'light' ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.35)'}`,
             }
          }),
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius, // 16px
          // Use surface-container color and outline from the palette
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.surfaceContainer : theme.palette.surfaceContainer,
          border: `1px solid ${theme.palette.outlineVariant}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', // Subtle shadow from InvesAfric
        }),
      },
    },
    MuiPaper: { // Ensure Paper also follows card styling for consistency if used as card
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.shape.borderRadius, // 16px
          backgroundColor: theme.palette.mode === 'light' ? theme.palette.surfaceContainer : theme.palette.surfaceContainer,
          // border: `1px solid ${theme.palette.outlineVariant}`, // Optional: only if all papers should look like cards
        }),
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiOutlinedInput-root': {
            borderRadius: theme.shape.borderRadius, // 16px
          },
        }),
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          width: 48,
          height: 48,
        },
      },
    },
    // Add other component overrides if needed
  },
});

// Create a theme instance.
// The mode will be toggled by ThemeContext. For now, we can default to light or get from context.
// This file will just export the function to generate tokens.
// The actual theme creation with mode will happen in ThemeContext.
// const theme = createTheme(getDesignTokens('light')); // Example for direct export

export { getDesignTokens }; // Export the function
// export default theme; // If ThemeContext doesn't handle mode switching from here
