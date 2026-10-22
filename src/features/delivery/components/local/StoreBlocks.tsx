import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Line } from 'react-native-svg';
import { FontFamily } from '@theme/fonts';
import { DeliveryColors } from '@theme/colors';
import { DeliveryShadow, useDeliveryColors } from '../../theme';
import { StoreLogo } from '../StoreLogo';
import { formatSoles } from '../../utils/money';
import { RESTAURANTS, type Product, type Restaurant, type Voucher } from '../../data/mock';

interface StoreInfoCardProps {
  restaurant: Restaurant;
  reviews: string;
  cuisine: string;
  deliveryLabel: string;
  fromMinutes: number;
}

/** Tarjeta del local que se sube sobre la foto (.rinfo). */
export function StoreInfoCard({ restaurant, reviews, cuisine, deliveryLabel, fromMinutes }: StoreInfoCardProps) {
  const colors = useDeliveryColors();
  const [name, area] = restaurant.name.split(' – ');

  return (
    <View style={[styles.info, { backgroundColor: colors.card }]}>
      <View style={[styles.thumb, { backgroundColor: restaurant.tint }]}>
        <Image source={restaurant.image} style={styles.thumbImage} />
      </View>
      <View style={styles.infoText}>
        <View style={styles.nameRow}>
          <StoreLogo logo={restaurant.logo} size={22} radius={6} fontSize={9} style={styles.nameLogo} />
          <Text style={[styles.name, { color: colors.ink }]} accessibilityRole="header">
            {name}
          </Text>
        </View>
        {area ? <Text style={[styles.area, { color: colors.muted }]}>– {area}</Text> : null}
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color={colors.star} />
            <Text style={[styles.metaText, { color: colors.ink }]}>{restaurant.rating.toFixed(1)}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.muted }]}>({reviews}) · {cuisine}</Text>
        </View>
        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Ionicons name="bicycle-outline" size={13} color={colors.ok} />
            <Text style={[styles.metaText, styles.ok, { color: colors.ok }]}>{deliveryLabel}</Text>
          </View>
          <Text style={[styles.metaText, { color: colors.muted }]}>· Desde {fromMinutes} min</Text>
        </View>
      </View>
    </View>
  );
}

/** Chips del local (.chips): pedido grupal con su descuento, programar y compartir. */
export function StoreChips({ groupDiscount }: { groupDiscount: string }) {
  const colors = useDeliveryColors();
  const chip = [styles.chip, { borderColor: colors.line, backgroundColor: colors.card }];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.chipsContent}>
      <Pressable style={chip} accessibilityRole="button" accessibilityLabel={`Pedido grupal, ${groupDiscount}`}>
        <Ionicons name="people-outline" size={16} color={colors.ink} />
        <Text style={[styles.chipText, { color: colors.ink }]}>Pedido grupal</Text>
        <View style={[styles.chipTag, { backgroundColor: colors.limeSoft }]}>
          <Text style={[styles.chipTagText, { color: colors.olive }]}>{groupDiscount}</Text>
        </View>
      </Pressable>
      <Pressable style={chip} accessibilityRole="button" accessibilityLabel="Programar pedido">
        <Ionicons name="calendar-outline" size={16} color={colors.ink} />
        <Text style={[styles.chipText, { color: colors.ink }]}>Programar</Text>
      </Pressable>
      <Pressable style={[chip, styles.chipSquare]} accessibilityRole="button" accessibilityLabel="Compartir local">
        <Ionicons name="share-social-outline" size={16} color={colors.ink} />
      </Pressable>
    </ScrollView>
  );
}

interface VoucherStripProps {
  vouchers: Voucher[];
  claimedIds: string[];
  onClaim: (voucher: Voucher) => void;
}

/** Cupones del local con su contador (.vouch / .vc). */
export function VoucherStrip({ vouchers, claimedIds, onClaim }: VoucherStripProps) {
  const colors = useDeliveryColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.vouchContent}>
      {vouchers.map((voucher) => {
        const claimed = claimedIds.includes(voucher.id);
        const store = voucher.issuer.type === 'store' ? RESTAURANTS[voucher.issuer.restaurantId] : null;
        return (
          <View key={voucher.id} style={[styles.voucher, { backgroundColor: colors.card }]}>
            <View style={[styles.voucherLeft, { backgroundColor: colors.limeSoft }]}>
              {store ? (
                <StoreLogo logo={store.logo} />
              ) : (
                <Ionicons name="ticket-outline" size={24} color={colors.olive} />
              )}
              <Text style={[styles.voucherIssuer, { color: colors.muted }]} numberOfLines={1}>
                {store ? store.name.split(' – ')[0] : 'Run'}
              </Text>
              {/* Corte punteado entre el talón y el cupón (border-right 1.5px dashed). */}
              <Svg style={styles.voucherCut} width={1.5} height="100%">
                <Line x1={0.75} y1={0} x2={0.75} y2="100%" stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 3" />
              </Svg>
            </View>
            <View style={styles.voucherBody}>
              <Text style={[styles.voucherTitle, { color: colors.ink }]}>{voucher.title}</Text>
              {voucher.lines.map((line) => (
                <Text key={line} style={[styles.voucherLine, { color: colors.muted }]}>
                  {line}
                </Text>
              ))}
            </View>
            {voucher.claimable ? (
              <Pressable
                onPress={() => onClaim(voucher)}
                disabled={claimed}
                style={[styles.claim, { backgroundColor: claimed ? colors.soft : colors.inkFill }]}
                accessibilityRole="button"
                accessibilityState={{ disabled: claimed }}
                accessibilityLabel={claimed ? `${voucher.title} reclamado` : `Reclamar ${voucher.title}`}
              >
                <Text style={[styles.claimText, { color: claimed ? colors.muted : colors.lime }]}>
                  {claimed ? 'Reclamado' : 'Reclamar'}
                </Text>
              </Pressable>
            ) : null}
            <View style={[styles.voucherCount, { backgroundColor: colors.limeSoft }]}>
              <Text style={[styles.voucherCountText, { color: colors.olive }]}>x{voucher.available}</Text>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  onAdd: () => void;
}

/** Tarjeta de "Para ti" (.fc): nombre, precio, foto, kcal, minutos y "+". */
export function ProductCard({ product, onPress, onAdd }: ProductCardProps) {
  const colors = useDeliveryColors();

  return (
    <Pressable
      onPress={onPress}
      style={[styles.productCard, { backgroundColor: colors.card }, DeliveryShadow.card]}
      accessibilityRole="button"
      accessibilityLabel={`${product.name}, ${formatSoles(product.price)}, ${product.kcal} kilocalorías, ${product.minutes} minutos`}
    >
      <Text style={[styles.productName, { color: colors.ink }]}>{product.name}</Text>
      <Text style={[styles.productPrice, { color: colors.muted }]}>{formatSoles(product.price)}</Text>
      <Image source={product.image} style={styles.productImage} />
      <View style={styles.kcal}>
        <Ionicons name="flame-outline" size={13} color={colors.flame} />
        <Text style={[styles.kcalText, { color: colors.ink }]}>{product.kcal} kcal</Text>
      </View>
      <View style={styles.kcal}>
        <Ionicons name="time-outline" size={13} color={colors.muted} />
        <Text style={[styles.kcalText, styles.kcalMuted, { color: colors.muted }]}>{product.minutes} min</Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={[styles.add, { backgroundColor: colors.lime }]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`Agregar ${product.name}`}
      >
        <Ionicons name="add" size={16} color={colors.onLime} />
      </Pressable>
    </Pressable>
  );
}

interface MenuListProps {
  products: Product[];
  onPress: (product: Product) => void;
  onAdd: (product: Product) => void;
}

/** Sección de la carta en lista (.mlist / .mrow) con la foto a la derecha. */
export function MenuList({ products, onPress, onAdd }: MenuListProps) {
  const colors = useDeliveryColors();

  return (
    <View style={[styles.menu, { backgroundColor: colors.card }]}>
      {products.map((product, index) => (
        <Pressable
          key={product.id}
          onPress={() => onPress(product)}
          style={[styles.menuRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
          accessibilityRole="button"
          accessibilityLabel={`${product.name}, ${formatSoles(product.price)}`}
        >
          <View style={styles.menuText}>
            <Text style={[styles.menuName, { color: colors.ink }]}>{product.name}</Text>
            <Text style={[styles.menuDescription, { color: colors.muted }]} numberOfLines={2}>
              {product.description}
            </Text>
            <Text style={[styles.menuPrice, { color: colors.ink }]}>{formatSoles(product.price)}</Text>
          </View>
          <View style={[styles.menuPhoto, { backgroundColor: product.tint }]}>
            <Image source={product.image} style={styles.menuImage} />
            <Pressable
              onPress={() => onAdd(product)}
              style={[styles.menuAdd, { backgroundColor: colors.lime }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Agregar ${product.name}`}
            >
              <Ionicons name="add" size={16} color={colors.onLime} />
            </Pressable>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  info: {
    borderRadius: 18,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    // 0 6px 18px rgba(17,21,25,.12)
    shadowColor: DeliveryColors.light.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  thumb: {
    width: 78,
    height: 78,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbImage: {
    width: 58,
    height: 58,
  },
  infoText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nameLogo: {
    marginRight: 6,
    marginTop: 4,
  },
  name: {
    fontFamily: FontFamily.semibold,
    fontSize: 19,
    lineHeight: 24,
  },
  area: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 16.9,
    marginBottom: 3,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 5,
    rowGap: 3,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
    lineHeight: 16.2,
  },
  ok: {
    fontFamily: FontFamily.semibold,
  },
  bleed: {
    marginRight: -14,
    overflow: 'visible',
  },
  chipsContent: {
    gap: 8,
    paddingRight: 14,
  },
  chip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  chipSquare: {
    width: 36,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: FontFamily.semibold,
    fontSize: 12.5,
  },
  chipTag: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  chipTagText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 14.8,
  },
  vouchContent: {
    gap: 10,
    paddingTop: 6,
    paddingRight: 14,
  },
  voucher: {
    width: 264,
    minHeight: 76,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10,
  },
  voucherLeft: {
    width: 70,
    alignSelf: 'stretch',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  voucherCut: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  voucherIssuer: {
    fontFamily: FontFamily.semibold,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  voucherBody: {
    flex: 1,
  },
  voucherTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    lineHeight: 20.3,
  },
  voucherLine: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  claim: {
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 5,
  },
  claimText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  voucherCount: {
    position: 'absolute',
    top: -7,
    right: 8,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  voucherCountText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 14.2,
  },
  productCard: {
    flex: 1,
    borderRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 10,
    paddingBottom: 10,
    alignItems: 'center',
    gap: 2,
  },
  productName: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 18.9,
    textAlign: 'center',
  },
  productPrice: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 16.9,
  },
  productImage: {
    width: 86,
    height: 86,
    marginVertical: 6,
  },
  kcal: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  kcalText: {
    fontFamily: FontFamily.semibold,
    fontSize: 11,
    lineHeight: 14.8,
  },
  kcalMuted: {
    fontFamily: FontFamily.medium,
  },
  add: {
    position: 'absolute',
    right: 10,
    bottom: 10,
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  menuText: {
    flex: 1,
  },
  menuName: {
    fontFamily: FontFamily.semibold,
    fontSize: 14.5,
    lineHeight: 19.6,
  },
  menuDescription: {
    fontFamily: FontFamily.regular,
    fontSize: 12,
    lineHeight: 16.2,
    marginTop: 3,
    marginBottom: 5,
  },
  menuPrice: {
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    lineHeight: 17,
  },
  menuPhoto: {
    width: 84,
    height: 76,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuImage: {
    width: 58,
    height: 58,
  },
  menuAdd: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
