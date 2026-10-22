import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Reanimated, { FadeIn, runOnJS, useAnimatedReaction, type SharedValue } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { FontFamily } from '@theme/fonts';
import type { CartItem } from '@store/useCartStore';
import { DeliveryShadow, useDeliveryColors } from '../../theme';
import { formatSoles } from '../../utils/money';
import { lineTotal } from '../../utils/cobro';
import { CART_THUMBS } from '../../data/mock';

/** Ancho del fondo rojo con la papelera (.citem.sw .del). */
const DELETE_WIDTH = 92;
/** Deslizar más que esto y soltar borra la fila sin tocar la papelera. */
const FULL_SWIPE = 170;

interface CartRowProps {
  item: CartItem;
  onToggle: () => void;
  onChangeQuantity: (quantity: number) => void;
  onRemove: () => void;
}

/** Fila del carrito (.citem): casilla, foto, nombre, opciones, precio y contador; se desliza para borrar. */
export function CartRow({ item, onToggle, onChangeQuantity, onRemove }: CartRowProps) {
  const colors = useDeliveryColors();
  const thumb = CART_THUMBS[item.productId];
  const maxDrag = React.useRef(0);

  const remove = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRemove();
  };

  return (
    <ReanimatedSwipeable
      friction={1.5}
      rightThreshold={DELETE_WIDTH / 2}
      overshootRight
      containerStyle={[styles.swipeContainer, { backgroundColor: colors.redSoft }]}
      onSwipeableWillOpen={() => {
        if (maxDrag.current > FULL_SWIPE) remove();
      }}
      onSwipeableOpenStartDrag={() => {
        maxDrag.current = 0;
      }}
      renderRightActions={(_progress, translation) => (
        <DeleteAction
          translation={translation}
          onDrag={(distance) => {
            maxDrag.current = Math.max(maxDrag.current, distance);
          }}
          onPress={remove}
        />
      )}
    >
      <View style={[styles.row, { backgroundColor: colors.card }, DeliveryShadow.card]}>
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          style={[
            styles.checkbox,
            item.selected
              ? { backgroundColor: colors.lime, borderColor: colors.limeStrong }
              : { backgroundColor: colors.card, borderColor: colors.faint },
          ]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.selected }}
          accessibilityLabel={`Pagar ${item.name}`}
        >
          {item.selected ? <Ionicons name="checkmark" size={13} color={colors.onLime} /> : null}
        </Pressable>
        <View style={[styles.thumb, { backgroundColor: thumb?.tint ?? colors.soft }]}>
          {thumb ? <Image source={thumb.image} style={styles.thumbImage} /> : null}
        </View>
        <View style={styles.text}>
          <Text style={[styles.name, { color: colors.ink }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.options, { color: colors.faint }]} numberOfLines={1}>
            {item.options}
          </Text>
          <Text style={[styles.price, { color: colors.ink }]}>{formatSoles(lineTotal(item))}</Text>
        </View>

        <View style={[styles.stepper, { backgroundColor: colors.soft }]}>
          {item.quantity === 1 ? (
            // Con 1 unidad, el "−" se vuelve papelera roja.
            <Pressable onPress={remove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Quitar ${item.name}`}>
              <Ionicons name="trash-outline" size={13} color={colors.red} />
            </Pressable>
          ) : (
            <Pressable
              onPress={() => onChangeQuantity(item.quantity - 1)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Quitar una unidad de ${item.name}`}
            >
              <Ionicons name="remove" size={13} color={colors.ink} />
            </Pressable>
          )}
          <Reanimated.Text key={item.quantity} entering={FadeIn.duration(140)} style={[styles.quantity, { color: colors.ink }]}>
            {item.quantity}
          </Reanimated.Text>
          <Pressable
            onPress={() => onChangeQuantity(item.quantity + 1)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Agregar una unidad de ${item.name}`}
          >
            <Ionicons name="add" size={13} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </ReanimatedSwipeable>
  );
}

interface DeleteActionProps {
  translation: SharedValue<number>;
  onDrag: (distance: number) => void;
  onPress: () => void;
}

/** Fondo rojo con la papelera que aparece al deslizar a la izquierda. */
function DeleteAction({ translation, onDrag, onPress }: DeleteActionProps) {
  const colors = useDeliveryColors();

  useAnimatedReaction(
    () => -translation.value,
    (distance) => {
      runOnJS(onDrag)(distance);
    },
  );

  return (
    <Pressable onPress={onPress} style={styles.deleteAction} accessibilityRole="button" accessibilityLabel="Borrar">
      <Ionicons name="trash-outline" size={24} color={colors.red} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    borderRadius: 16,
  },
  row: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: 58,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 44,
    height: 44,
  },
  text: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 18.9,
  },
  options: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
    marginTop: 2,
    marginBottom: 6,
  },
  price: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 19,
  },
  stepper: {
    position: 'absolute',
    right: 10,
    bottom: 12,
    height: 28,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  quantity: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 17.5,
    minWidth: 7,
    textAlign: 'center',
  },
  deleteAction: {
    width: DELETE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
