import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function GuruLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: Colors.primary,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarStyle: { borderTopColor: Colors.border },
      headerStyle: { backgroundColor: Colors.card },
      headerTitleStyle: { fontWeight: "700" },
    }}>
      <Tabs.Screen name="index" options={{
        title: "Dashboard",
        tabBarIcon: ({ color, size }) => <FontAwesome name="dashboard" size={size} color={color} />,
      }} />
      <Tabs.Screen name="presensi" options={{
        title: "Presensi",
        tabBarIcon: ({ color, size }) => <FontAwesome name="check-square-o" size={size} color={color} />,
      }} />
      <Tabs.Screen name="history" options={{
        title: "Riwayat",
        tabBarIcon: ({ color, size }) => <FontAwesome name="history" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: "Profil",
        tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
