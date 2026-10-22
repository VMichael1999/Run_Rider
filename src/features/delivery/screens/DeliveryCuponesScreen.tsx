import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, type NavigationProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import type { DeliveryStackParamList } from '@navigation/types';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { DeliveryScreenHeader } from '../components/DeliveryScreenHeader';
import { StoreLogo } from '../components/StoreLogo';
import { DeliveryToast, useToast } from '../components/DeliveryToast';
import { useCouponsStore } from '../store/useCouponsStore';
import { RESTAURANTS, RESTAURANT_DETAILS } from '../data/mock';
import type { AccountCoupon } from '../data/account';

type Tab = 'disponibles' | 'historial';

/** Cupones de la cuenta: disponibles (con Usar) e historial (usados o vencidos); se agregan códigos a mano. */
export function DeliveryCuponesScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp<DeliveryStackParamList>>();
  useStatusBarStyle('dark');

  const coupons = useCouponsStore((s) => s.coupons);
  const redeem = useCouponsStore((s) => s.redeem);
  const [tab, setTab] = React.useState<Tab>('disponibles');
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const { toast, show } = useToast();

  const list = coupons.filter((coupon) => (tab === 'disponibles' ? coupon.state === 'disponible' : coupon.state !== 'disponible'));

  const add = () => {
    const result = redeem(code);
    if (result === 'agregado') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      show({ icon: 'ticket-outline', title: 'Cupón agregado', subtitle: `${code.trim().toUpperCase()} ya está en tus cupones` });
      setCode('');
      setError('');
      setTab('disponibles');
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(result === 'repetido' ? 'Ya tienes este cupón.' : 'Este código no existe o ya venció.');
    }
  };

  const use = (coupon: AccountCoupon) => {
    if (coupon.restaurantId && RESTAURANT_DETAILS[coupon.restaurantId]) {
      navigation.navigate('DeliveryLocal', { restaurantId: coupon.restaurantId });
    } else {
      navigation.navigate('DeliveryTabs', { screen: 'DeliveryInicio' });
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <DeliveryScreenHeader title="Cupones" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.codeBox, { backgroundColor: colors.card }, DeliveryShadow.card]}>
          <Ionicons name="pricetag-outline" size={18} color={colors.muted} />
          <TextInput
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError('');
            }}
            onSubmitEditing={add}
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="Ingresa un código"
            placeholderTextColor={colors.faint}
            style={[styles.input, { color: colors.ink }]}
            accessibilityLabel="Código de cupón"
          />
          <Pressable
            onPress={add}
            disabled={code.trim().length === 0}
            style={[styles.addButton, { backgroundColor: colors.inkFill }, code.trim().length === 0 && styles.disabled]}
            accessibilityRole="button"
          >
            <Text style={[styles.addText, { color: colors.lime }]}>Agregar</Text>
          </Pressable>
        </View>
        {error ? <Text style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
        <Text style={[styles.hint, { color: colors.faint }]}>Prueba con RUNRIDER10 o BIENVENIDA.</Text>

        <View style={[styles.tabs, { backgroundColor: colors.soft }]} accessibilityRole="tablist">
          {(['disponibles', 'historial'] as Tab[]).map((item) => {
            const on = item === tab;
            const count = coupons.filter((c) => (item === 'disponibles' ? c.state === 'disponible' : c.state !== 'disponible')).length;
            return (
              <Pressable
                key={item}
                onPress={() => setTab(item)}
                style={[styles.tab, on && [styles.tabOn, { backgroundColor: colors.card }]]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.tabText, { color: on ? colors.ink : colors.muted }, on && styles.tabTextOn]}>
                  {item === 'disponibles' ? 'Disponibles' : 'Historial'} ({count})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {list.map((coupon) => (
          <CouponCard key={coupon.id} coupon={coupon} onUse={coupon.state === 'disponible' ? () => use(coupon) : undefined} />
        ))}
      </ScrollView>
      <DeliveryToast toast={toast} bottom={insets.bottom + 24} />
    </View>
  );
}

function CouponCard({ coupon, onUse }: { coupon: AccountCoupon; onUse?: () => void }) {
  const colors = useDeliveryColors();
  const store = coupon.restaurantId ? RESTAURANTS[coupon.restaurantId] : null;
  const inactive = coupon.state !== 'disponible';

  return (
    <View style={[styles.coupon, { backgroundColor: colors.card }, inactive && styles.inactive, DeliveryShadow.card]}>
      <View style={[styles.stub, { backgroundColor: inactive ? colors.soft : colors.limeSoft }]}>
        {store ? <StoreLogo logo={store.logo} /> : <Ionicons name="ticket-outline" size={24} color={inactive ? colors.muted : colors.olive} />}
        <Text style={[styles.stubText, { color: inactive ? colors.muted : colors.olive }]} numberOfLines={1}>
          {store ? store.name.split(' – ')[0] : 'Run'}
        </Text>
        <Svg style={styles.cut} width={1.5} height="100%">
          <Line x1={0.75} y1={0} x2={0.75} y2="100%" stroke={colors.line} strokeWidth={1.5} strokeDasharray="4 3" />
        </Svg>
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.ink }]}>{coupon.title}</Text>
        <Text style={[styles.small, { color: colors.muted }]}>{coupon.conditions}</Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.code, { color: colors.ink, borderColor: colors.line }]}>{coupon.code}</Text>
          <Text style={[styles.small, { color: coupon.state === 'vencido' ? colors.red : colors.faint }]}>{coupon.expires}</Text>
        </View>
      </View>
      {onUse ? (
        <Pressable onPress={onUse} style={[styles.use, { backgroundColor: colors.lime }]} accessibilityRole="button" accessibilityLabel={`Usar ${coupon.code}`}>
          <Text style={[styles.useText, { color: colors.onLime }]}>Usar</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingHorizontal: 14,
    gap: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    paddingLeft: 14,
    paddingRight: 6,
    height: 52,
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FontFamily.semibold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  addButton: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    fontFamily: FontFamily.bold,
    fontSize: 13,
  },
  disabled: {
    opacity: 0.4,
  },
  error: {
    fontFamily: FontFamily.medium,
    fontSize: 12.5,
    marginTop: -4,
    marginLeft: 4,
  },
  hint: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
    marginTop: -4,
    marginLeft: 4,
  },
  tabs: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginTop: 4,
  },
  tab: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabOn: {
    elevation: 2,
  },
  tabText: {
    fontFamily: FontFamily.medium,
    fontSize: 13.5,
  },
  tabTextOn: {
    fontFamily: FontFamily.semibold,
  },
  coupon: {
    borderRadius: 16,
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingRight: 12,
  },
  inactive: {
    opacity: 0.6,
  },
  stub: {
    width: 74,
    alignSelf: 'stretch',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  stubText: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
  },
  cut: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
  },
  body: {
    flex: 1,
    gap: 2,
    paddingVertical: 10,
  },
  title: {
    fontFamily: FontFamily.semibold,
    fontSize: 16,
  },
  small: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  code: {
    fontFamily: FontFamily.semibold,
    fontSize: 10.5,
    letterSpacing: 0.4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    overflow: 'hidden',
  },
  use: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  useText: {
    fontFamily: FontFamily.bold,
    fontSize: 12.5,
  },
});
