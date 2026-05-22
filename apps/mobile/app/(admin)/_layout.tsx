import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import Colors from "@/constants/Colors";

export default function AdminLayout() {
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
      <Tabs.Screen name="data" options={{
        title: "Data",
        tabBarIcon: ({ color, size }) => <FontAwesome name="database" size={size} color={color} />,
      }} />
      <Tabs.Screen name="laporan" options={{
        title: "Laporan",
        tabBarIcon: ({ color, size }) => <FontAwesome name="bar-chart" size={size} color={color} />,
      }} />
      <Tabs.Screen name="settings" options={{
        title: "Lainnya",
        tabBarIcon: ({ color, size }) => <FontAwesome name="cog" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
