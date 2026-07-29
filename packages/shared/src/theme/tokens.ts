export const Colors = {
  light: {
    primary: '#000000',
    background: '#FFFFFF',
    surface: '#F8F8F8',
    text: '#000000',
    textSecondary: '#666666',
    border: '#E0E0E0',
    accent: '#000000',
    error: '#FF3B30',
    success: '#34C759',
  },
  dark: {
    primary: '#FFFFFF',
    background: '#121212',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: '#A0A0A0',
    border: '#2C2C2C',
    accent: '#FFFFFF',
    error: '#FF453A',
    success: '#32D74B',
  }
};

export const Typography = {
  h1: {
    fontFamily: 'Inter-ExtraBold',
    fontSize: 32,
    letterSpacing: -0.6,
    fontWeight: '800' as const,
  },
  h2: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    letterSpacing: -0.4,
    fontWeight: '700' as const,
  },
  label: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
  },
  body: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  }
};

export const MapStyles = {
  light: [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
  ],
  dark: [
    { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#2c2c2c" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] }
  ]
};
