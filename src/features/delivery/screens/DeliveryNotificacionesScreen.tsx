import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { DeliveryScreenHeader } from '../components/DeliveryScreenHeader';
import { unreadCount, useNotificationsStore } from '../store/useNotificationsStore';
import { NOTIFICATION_ICONS, type DeliveryNotification } from '../data/account';

const GROUPS: DeliveryNotification['group'][] = ['Hoy', 'Esta semana', 'Antes'];

/** Notificaciones de delivery: pedidos, promociones, cupones y cuenta. */
export function DeliveryNotificacionesScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const items = useNotificationsStore((s) => s.items);
  const markRead = useNotificationsStore((s) => s.markRead);
  const markAllRead = useNotificationsStore((s) => s.markAllRead);
  const unread = unreadCount(items);

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <DeliveryScreenHeader
        title="Notificaciones"
        subtitle={unread ? `${unread} sin leer` : 'Todo leído'}
        action={{ label: 'Leer todo', accessibilityLabel: 'Marcar todo como leído', onPress: markAllRead, disabled: unread === 0 }}
      />
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        {GROUPS.map((group) => {
          const groupItems = items.filter((item) => item.group === group);
          if (groupItems.length === 0) return null;
          return (
            <View key={group} style={styles.group}>
              <Text style={[styles.groupTitle, { color: colors.muted }]}>{group}</Text>
              <View style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}>
                {groupItems.map((item, index) => (
                  <Pressable
                    key={item.id}
                    onPress={() => markRead(item.id)}
                    style={[styles.row, index > 0 && { borderTopWidth: 1, borderTopColor: colors.line }]}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.read ? '' : 'Sin leer. '}${item.title}. ${item.body}`}
                  >
                    <View style={[styles.icon, { backgroundColor: item.read ? colors.soft : colors.limeSoft }]}>
                      <Ionicons name={NOTIFICATION_ICONS[item.kind]} size={18} color={item.read ? colors.muted : colors.olive} />
                    </View>
                    <View style={styles.text}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: colors.ink }, !item.read && styles.titleUnread]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={[styles.time, { color: colors.faint }]}>{item.time}</Text>
                      </View>
                      <Text style={[styles.body, { color: colors.muted }]}>{item.body}</Text>
                    </View>
                    {!item.read ? <View style={[styles.dot, { backgroundColor: colors.limeStrong }]} /> : null}
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
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
    gap: 14,
  },
  group: {
    gap: 6,
  },
  groupTitle: {
    fontFamily: FontFamily.semibold,
    fontSize: 12.5,
    marginLeft: 4,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 3,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: FontFamily.medium,
    fontSize: 14,
    lineHeight: 18,
  },
  titleUnread: {
    fontFamily: FontFamily.semibold,
  },
  time: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  body: {
    fontFamily: FontFamily.regular,
    fontSize: 12.5,
    lineHeight: 17,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
});
