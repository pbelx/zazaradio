import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#000', // Dark background
        },
        headerTintColor: '#fff', // White text
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
}