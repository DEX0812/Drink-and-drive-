import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, Animated, Dimensions, Platform, View } from 'react-native';
import { useTheme } from '@platform/shared/src/theme/ThemeProvider';
import { Bell } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface Props {
  visible: boolean;
  title: string;
  body: string;
  onHide: () => void;
}

export default function NotificationToast({ visible, title, body, onHide }: Props) {
  const { theme, typography } = useTheme();
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      Animated.spring(slideAnim, {
        toValue: 20,
        useNativeDriver: true,
        bounciness: 12,
      }).start();

      const timer = setTimeout(() => {
         hide();
      }, 5000);
      return () => clearTimeout(timer);
    } else if (shouldRender) {
      hide();
    }
  }, [visible]);

  const hide = () => {
    Animated.timing(slideAnim, {
      toValue: -150,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShouldRender(false);
      onHide();
    });
  };

  if (!shouldRender) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: theme.background, 
          borderColor: theme.border,
          transform: [{ translateY: slideAnim }] 
        }
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: theme.primary + '11' }]}>
        <Bell size={20} color={theme.primary} />
      </View>
      <View style={styles.content}>
        <Text style={[typography.h2, { color: theme.text, fontSize: 13, marginBottom: 2 }]}>{title}</Text>
        <Text style={[typography.body, { color: theme.textSecondary, fontSize: 11 }]} numberOfLines={1}>{body}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 9999,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 10 },
    }),
  },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  content: { flex: 1 },
});
