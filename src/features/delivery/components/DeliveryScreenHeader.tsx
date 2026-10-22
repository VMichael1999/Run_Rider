import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { useDeliveryColors } from '../theme';

interface DeliveryScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Acción de la derecha (texto corto o ícono). */
  action?: { label?: string; icon?: keyof typeof Ionicons.glyphMap; accessibilityLabel: string; onPress: () => void; disabled?: boolean };
}

/** Barra superior de las pantallas de delivery (.appbar.c): volver, título centrado y una acción opcional. */
export function DeliveryScreenHeader({ title, subtitle, action }: DeliveryScreenHeaderProps) {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 4 }]}>
      <Pressable
        onPress={() => navigation.goBack()}
        style={[styles.round, { backgroundColor: colors.card }]}
        accessibilityRole="button"
        accessibilityLabel="Volver"
      >
        <Ionicons name="arrow-back" size={20} color={colors.ink} />
      </Pressable>
      <View style={styles.title}>
        <Text style={[styles.titleText, { color: colors.ink }]} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[styles.subtitle, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      {action ? (
        <Pressable
          onPress={action.onPress}
          disabled={action.disabled}
          style={[action.icon ? styles.round : styles.textAction, action.icon && { backgroundColor: colors.card }, action.disabled && styles.disabled]}
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          hitSlop={8}
        >
          {action.icon ? (
            <Ionicons name={action.icon} size={20} color={colors.ink} />
          ) : (
            <Text style={[styles.actionText, { color: colors.olive }]}>{action.label}</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  spacer: {
    width: 40,
  },
  title: {
    flex: 1,
    alignItems: 'center',
  },
  titleText: {
    fontFamily: FontFamily.semibold,
    fontSize: 18,
  },
  subtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  textAction: {
    minWidth: 40,
    alignItems: 'flex-end',
  },
  actionText: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.4,
  },
});
