/**
 * This file defines the layout for the main bottom tab navigator.
 * It configures the tabs, their icons, and appearance, serving as the
 * primary navigation hub for the user.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

const ICON_SIZE = 26;

const TabBarIcon = ({
  name,
  focused,
  color,
  isMaterial = false,
}: {
  name: any;
  focused: boolean;
  color: string;
  isMaterial?: boolean;
}) => {
  const IconComponent = isMaterial ? MaterialCommunityIcons : Ionicons;
  return (
    <View style={styles.iconContainer}>
      <IconComponent name={name} size={ICON_SIZE} color={color} />
      {focused && <View style={styles.activeIndicator} />}
    </View>
  );
};

export default function TabLayout() {
  const theme = {
    background: '#111927',
    active: '#FFFFFF',
    inactive: '#6B768A',
    primary: '#2F80ED',
    border: 'rgba(255, 255, 255, 0.1)',
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarActiveTintColor: theme.active,
        tabBarInactiveTintColor: theme.inactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="bar-chart" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="trade"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="swap-horizontal-bold" color={color} focused={focused} isMaterial />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          tabBarIcon: ({ color, focused }) => <TabBarIcon name="receipt-long" color={color} focused={focused} isMaterial />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="settings-sharp" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 10 : 0,
    gap: 4,
  },
  activeIndicator: {
    height: 4,
    width: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
});
