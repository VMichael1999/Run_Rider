import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Reanimated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { FontFamily } from '@theme/fonts';
import { useDeliveryColors } from '../../theme';
import { formatSoles } from '../../utils/money';
import type { OptionGroup } from '../../data/mock';

interface OptionGroupViewProps {
  group: OptionGroup;
  selected: string[];
  /** El grupo que se está tocando toma el fondo #F6F8EC (.grp.hl). */
  active: boolean;
  onToggle: (optionId: string) => void;
}

/** Grupo de opciones del producto (.grp): "Elige 1" con radios u "Opcional" con casillas. */
export function OptionGroupView({ group, selected, active, onToggle }: OptionGroupViewProps) {
  const colors = useDeliveryColors();
  const highlightStyle = useAnimatedStyle(() => ({ opacity: withTiming(active ? 1 : 0, { duration: 180 }) }), [active]);

  return (
    <View style={[styles.group, { borderBottomColor: colors.line }]} accessibilityRole={group.type === 'single' ? 'radiogroup' : undefined}>
      <Reanimated.View style={[styles.highlight, { backgroundColor: colors.groupActive }, highlightStyle]} pointerEvents="none" />
      <GroupHeader title={group.title} tag={group.type === 'single' ? 'Elige 1' : 'Opcional'} />
      {group.options.map((option) => {
        const on = selected.includes(option.id);
        const price = group.type === 'single' ? formatSoles(option.price) : `+${formatSoles(option.price)}`;
        return (
          <Pressable
            key={option.id}
            onPress={() => onToggle(option.id)}
            style={styles.option}
            accessibilityRole={group.type === 'single' ? 'radio' : 'checkbox'}
            accessibilityState={group.type === 'single' ? { selected: on } : { checked: on }}
            accessibilityLabel={`${option.label}${option.detail ? `, ${option.detail}` : ''}, ${price}`}
          >
            <View style={styles.markCell}>
              {group.type === 'single' ? (
                <View
                  style={[
                    styles.radio,
                    on ? { borderWidth: 6, borderColor: colors.limeStrong } : { borderColor: colors.faint },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.box,
                    on ? { backgroundColor: colors.lime, borderColor: colors.limeStrong } : { borderColor: colors.faint },
                  ]}
                >
                  {on ? <Ionicons name="checkmark" size={13} color={colors.onLime} /> : null}
                </View>
              )}
            </View>
            <Text style={[styles.label, { color: colors.ink }]}>
              {option.label}
              {option.detail ? <Text style={[styles.detail, { color: colors.faint }]}> {option.detail}</Text> : null}
            </Text>
            <Text style={[styles.price, { color: colors.ink }]}>{price}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Título del grupo con su etiqueta gris (.gh). */
export function GroupHeader({ title, tag }: { title: string; tag: string }) {
  const colors = useDeliveryColors();

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: colors.ink }]} accessibilityRole="header">
        {title}
      </Text>
      <View style={[styles.tag, { backgroundColor: colors.soft }]}>
        <Text style={[styles.tagText, { color: colors.muted }]}>{tag}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  // .grp.hl: margin 0 -14px; padding 4px 14px 10px — el fondo llega a los bordes de la pantalla.
  highlight: {
    position: 'absolute',
    top: -4,
    bottom: 0,
    left: -14,
    right: -14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
    lineHeight: 21.6,
  },
  tag: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 1,
  },
  tagText: {
    fontFamily: FontFamily.medium,
    fontSize: 11,
    lineHeight: 14.8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 38,
  },
  markCell: {
    width: 24,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  box: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: 14,
    lineHeight: 18.9,
  },
  detail: {
    fontSize: 12,
  },
  price: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
    lineHeight: 18.2,
  },
});
