import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { getAppTheme } from '../utils/theme'; // Your theme generation function

// Initial context structure with defaults
const ThemeContext = createContext({
  mode: 'light',
  sourceColor: '#6750A4', // Default Material You purple
  toggleTheme: () => {},
  setSourceColor: () => {},
  materialYouEnabled: true,
});

export const useThemeMode = () => useContext(ThemeContext);

export const AppThemeProvider = ({ children }) => {
  const [mode, setMode] = useState(() => {
    // Get stored theme mode or default to light
    const storedMode = localStorage.getItem('themeMode');
    return storedMode || 'light';
  });

  const [sourceColor, setSourceColor] = useState(() => {
    // Get stored source color or default to Material You purple
    const storedColor = localStorage.getItem('themeSourceColor');
    return storedColor || '#6750A4';
  });

  // Check if Material You theming is enabled from env vars
  const materialYouEnabled = process.env.REACT_APP_ENABLE_MATERIAL_YOU !== 'false';

  useEffect(() => {
    // Persist theme mode to localStorage
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  useEffect(() => {
    // Persist source color to localStorage
    localStorage.setItem('themeSourceColor', sourceColor);
  }, [sourceColor]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const handleSetSourceColor = (color) => {
    if (color && /^#[0-9A-F]{6}$/i.test(color)) {
      setSourceColor(color);
    } else {
      console.warn('Invalid color format. Expected hex color (e.g. #FF0000)');
    }
  };

  // Generate the theme based on the current mode and source color
  // useMemo ensures the theme is only regenerated when the mode or source color changes
  const theme = useMemo(() => {
    try {
      return getAppTheme(mode, materialYouEnabled ? sourceColor : null);
    } catch (error) {
      console.error('Error generating theme:', error);
      // Fallback to basic theme without Material You customization
      return getAppTheme(mode);
    }
  }, [mode, sourceColor, materialYouEnabled]);

  const contextValue = {
    mode, 
    toggleTheme,
    sourceColor,
    setSourceColor: handleSetSourceColor,
    materialYouEnabled,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MUIThemeProvider theme={theme}>
        <CssBaseline /> {/* Applies baseline styles and dark mode background */} 
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
