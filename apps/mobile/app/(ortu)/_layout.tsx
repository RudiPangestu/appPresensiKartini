import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function OrtuLayout() {
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
      <Tabs.Screen name="kehadiran" options={{
        title: "Kehadiran",
        tabBarIcon: ({ color, size }) => <FontAwesome name="calendar-check-o" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profil" options={{
        title: "Profil",
        tabBarIcon: ({ color, size }) => <FontAwesome name="user" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
