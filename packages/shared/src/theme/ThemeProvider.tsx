import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, Typography, MapStyles } from './tokens';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  theme: typeof Colors.light;
  typography: typeof Typography;
  mapStyle: typeof MapStyles.light;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>(systemScheme || 'light');

  useEffect(() => {
    if (systemScheme) setMode(systemScheme);
  }, [systemScheme]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'user-dark' as any)); // Simplified for now
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const currentTheme = mode === 'light' ? Colors.light : Colors.dark;
  const currentMap = mode === 'light' ? MapStyles.light : MapStyles.dark;

  return (
    <ThemeContext.Provider 
      value={{ 
        mode, 
        theme: currentTheme, 
        typography: Typography, 
        mapStyle: currentMap,
        toggleTheme, 
        setTheme: setMode 
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
