import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  TextInput, 
  StyleSheet, 
  View, 
  TextStyle, 
  ViewStyle, 
  TextInputProps,
  Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({ label, onPress, variant = 'primary', style }) => {
  const { theme, typography } = useTheme();
  
  const getBtnStyle = () => {
    if (variant === 'primary') return { backgroundColor: theme.text };
    if (variant === 'outline') return { borderWidth: 2, borderColor: theme.border };
    return { backgroundColor: theme.surface };
  };

  const getTextColor = () => {
    if (variant === 'primary') return theme.background;
    return theme.text;
  };

  return (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={onPress} 
      style={[styles.btnBase, getBtnStyle(), style]}
    >
      <Text style={[typography.label, { color: getTextColor(), letterSpacing: 1.2 }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export const Card: React.FC<{ children: React.ReactNode; style?: ViewStyle }> = ({ children, style }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.cardBase, { backgroundColor: theme.background, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
};

interface InputProps extends TextInputProps {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, ...props }) => {
  const { theme, typography } = useTheme();
  
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={[typography.label, { color: theme.textSecondary, marginBottom: 12, fontSize: 10 }]}>{label}</Text>}
      <TextInput
        placeholderTextColor={theme.textSecondary}
        style={[
          styles.inputBase, 
          { 
            color: theme.text, 
            borderColor: theme.border,
            backgroundColor: theme.surface,
          }
        ]}
        {...props}
      />
    </View>
  );
};

export const Heading: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => {
  const { theme, typography } = useTheme();
  return <Text style={[typography.h1, { color: theme.text }, style]}>{children}</Text>;
};

export const SubHeading: React.FC<{ children: React.ReactNode; style?: TextStyle }> = ({ children, style }) => {
  const { theme, typography } = useTheme();
  return <Text style={[typography.h2, { color: theme.textSecondary }, style]}>{children}</Text>;
};

export const Spacer: React.FC<{ size?: number; horizontal?: boolean }> = ({ size = 20, horizontal }) => (
  <View style={horizontal ? { width: size } : { height: size }} />
);

const styles = StyleSheet.create({
  btnBase: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8 },
      android: { elevation: 4 }
    })
  },
  cardBase: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.05, shadowRadius: 20 },
      android: { elevation: 6 }
    })
  },
  inputContainer: {
    marginBottom: 24,
    width: '100%',
  },
  inputBase: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  }
});
