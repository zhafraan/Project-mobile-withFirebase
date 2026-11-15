// src/components/password-eye.tsx
import { Image, Pressable, StyleSheet } from 'react-native';

const eyeOpenIcon = require('@/assets/images/eye-open.png');
const eyeClosedIcon = require('@/assets/images/eye-closed.png');

interface PasswordEyeProps {
  showPassword: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function PasswordEye({ showPassword, onPress, disabled }: PasswordEyeProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Lihat password'}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Image
        source={showPassword ? eyeClosedIcon : eyeOpenIcon}
        style={[styles.icon, showPassword ? styles.iconActive : styles.iconDefault]}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.5,
  },
  icon: {
    width: 22,
    height: 22,
  },
  iconDefault: {
    tintColor: '#6B7280',
  },
  iconActive: {
    tintColor: '#111827',
  },
});
