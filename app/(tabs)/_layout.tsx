/**
 * Bottom tab navigator configuration.
 * Pulls theme colors from global settings and exposes the portfolio, market, trading,
 * history analytics, NFT gallery, and settings tabs.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppStore } from '../../state/store';

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
  const theme = useAppStore((state) => state.theme);
  const colorScheme = theme === 'light' ? 'light' : theme === 'oled' ? 'dark' : theme;

  const colors = {
    background: colorScheme === 'light' ? '#FFFFFF' : '#0B1220',
    active: '#FFFFFF',
    inactive: 'rgba(255,255,255,0.5)',
    border: 'rgba(255, 255, 255, 0.08)',
  };

  if (colorScheme === 'light') {
    colors.active = '#0B1220';
    colors.inactive = '#6B7280';
    colors.border = 'rgba(15, 23, 42, 0.08)';
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: Platform.OS === 'ios' ? 90 : 70,
        },
        tabBarActiveTintColor: colors.active,
        tabBarInactiveTintColor: colors.inactive,
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="receipt" color={color} focused={focused} isMaterial />
          ),
        }}
      />
      <Tabs.Screen
        name="nfts"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="diamond-stone" color={color} focused={focused} isMaterial />
          ),
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
    backgroundColor: '#2F80ED',
    marginTop: 4,
  },
});

