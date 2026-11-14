import { Slot } from 'expo-router';
import { StyleSheet, View } from 'react-native';

export default function AppTabs() {
  return (
    <View style={styles.container}>
      <Slot />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
