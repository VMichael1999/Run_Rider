import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../../theme';
import { GradientFill } from '../GradientFill';
import { FOOD_IMAGES, type Category, type Deal } from '../../data/mock';

/** Banner del inicio (.hero): 138 de alto, radio 20. */
export function HeroBanner() {
  const colors = useDeliveryColors();

  return (
    <View style={styles.hero} accessible accessibilityLabel="Envío rápido y gratis en todos tus pedidos esta semana. Pide ya">
      <GradientFill
        type="radial"
        cx={0.85}
        cy={0.6}
        rx={0.9}
        ry={1.2}
        stops={[
          { color: colors.heroGlow, offset: 0 },
          { color: colors.heroBase, offset: 0.7 },
        ]}
      />
      <View style={styles.heroText}>
        <Text style={[styles.heroTitle, { color: colors.onDark }]}>
          ¡Envío rápido{'\n'}y <Text style={{ color: colors.lime }}>gratis</Text>!
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.onDark }]}>En todos tus pedidos esta semana</Text>
        <View style={[styles.heroCta, { backgroundColor: colors.lime }]}>
          <Text style={[styles.heroCtaText, { color: colors.onLime }]}>Pide ya</Text>
        </View>
      </View>
      <Image source={FOOD_IMAGES.moto} style={styles.heroImage} />
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  /** Sin él, no se muestra "Ver todo". */
  onSeeAll?: () => void;
}

/** Título de sección (.sh) con "Ver todo" en oliva. */
export function SectionHeader({ title, onSeeAll }: SectionHeaderProps) {
  const colors = useDeliveryColors();

  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.ink }]} accessibilityRole="header">
        {title}
      </Text>
      {onSeeAll ? (
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel={`Ver todo: ${title}`} hitSlop={8}>
          <Text style={[styles.seeAll, { color: colors.olive }]}>Ver todo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

interface CategoryStripProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Categorías en cuadros de 62 × 74 (.cats); la elegida va en lima. */
export function CategoryStrip({ categories, selectedId, onSelect }: CategoryStripProps) {
  const colors = useDeliveryColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.stripContent}>
      {categories.map((category) => {
        const selected = category.id === selectedId;
        return (
          <Pressable
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[styles.category, { backgroundColor: selected ? colors.lime : colors.card }, DeliveryShadow.card]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={category.label}
          >
            <View style={styles.categoryIcon}>
              <Image source={category.image} style={styles.categoryImage} />
            </View>
            <Text style={[styles.categoryLabel, { color: selected ? colors.onLime : colors.ink }, selected && styles.categoryLabelOn]}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Ofertas en tarjetas oscuras de 226 × 100 (.deal) con código y "Aplicar". */
export function DealStrip({ deals }: { deals: Deal[] }) {
  const colors = useDeliveryColors();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bleed} contentContainerStyle={styles.stripContent}>
      {deals.map((deal) => (
        <View key={deal.id} style={styles.deal}>
          <GradientFill
            type="linear"
            angle={120}
            stops={[
              { color: colors.heroBase, offset: 0.45 },
              { color: colors.dealGlow, offset: 1 },
            ]}
          />
          <View style={styles.dealText}>
            <Text style={[styles.dealEyebrow, { color: colors.onDark }]}>{deal.eyebrow}</Text>
            <Text style={[styles.dealTitle, { color: colors.onDark }]}>{deal.title}</Text>
            <View style={styles.dealActions}>
              <View style={[styles.dealCode, { borderColor: colors.onDarkLine }]}>
                <Text style={[styles.dealCodeText, { color: colors.onDark }]}>{deal.code}</Text>
              </View>
              <Pressable
                style={[styles.dealClaim, { backgroundColor: colors.lime }]}
                accessibilityRole="button"
                accessibilityLabel={`Aplicar código ${deal.code}`}
              >
                <Text style={[styles.dealClaimText, { color: colors.onLime }]}>Aplicar</Text>
              </Pressable>
            </View>
          </View>
          <Image source={deal.image} style={styles.dealImage} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 138,
    borderRadius: 20,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 6,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: FontFamily.boldItalic,
    fontSize: 22,
    lineHeight: 23.1,
    letterSpacing: -0.22,
  },
  heroSubtitle: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    lineHeight: 15.5,
    opacity: 0.75,
    marginTop: 5,
    marginBottom: 8,
  },
  heroCta: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroCtaText: {
    fontFamily: FontFamily.bold,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  heroImage: {
    width: 120,
    height: 120,
    transform: [{ scaleX: -1 }],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
  },
  sectionTitle: {
    flexShrink: 1,
    fontFamily: FontFamily.semibold,
    fontSize: 17,
    lineHeight: 22.9,
    letterSpacing: -0.17,
  },
  seeAll: {
    fontFamily: FontFamily.semibold,
    fontSize: 13,
    lineHeight: 17.5,
  },
  // Las tiras horizontales llegan hasta el borde derecho de la pantalla (margin-right:-14px).
  bleed: {
    marginRight: -14,
    overflow: 'visible',
  },
  stripContent: {
    gap: 10,
    paddingRight: 14,
  },
  category: {
    width: 62,
    height: 74,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  categoryIcon: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryImage: {
    width: 36,
    height: 36,
  },
  categoryLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
    lineHeight: 15.5,
  },
  categoryLabelOn: {
    fontFamily: FontFamily.semibold,
  },
  deal: {
    width: 226,
    height: 100,
    borderRadius: 16,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 14,
    paddingRight: 6,
  },
  dealText: {
    flex: 1,
  },
  dealEyebrow: {
    fontFamily: FontFamily.semibold,
    fontSize: 9.5,
    lineHeight: 12.8,
    letterSpacing: 0.57,
    opacity: 0.75,
  },
  dealTitle: {
    fontFamily: FontFamily.bold,
    fontSize: 22,
    lineHeight: 24.2,
    marginBottom: 8,
  },
  dealActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  dealCode: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 4,
  },
  dealCodeText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    lineHeight: 13.5,
    letterSpacing: 0.4,
  },
  dealClaim: {
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  dealClaimText: {
    fontFamily: FontFamily.bold,
    fontSize: 10.5,
    lineHeight: 14.2,
  },
  dealImage: {
    width: 84,
    height: 84,
  },
});
