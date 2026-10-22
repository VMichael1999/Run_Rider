import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FontFamily } from '@theme/fonts';
import { DeliveryShadow, useDeliveryColors } from '../theme';
import { useStatusBarStyle } from '../hooks/useStatusBarStyle';
import { DeliveryScreenHeader } from '../components/DeliveryScreenHeader';
import { DeliveryToast, useToast } from '../components/DeliveryToast';
import { useBillingStore, validateBilling, type BillingData, type BillingErrors, type ReceiptType } from '../store/useBillingStore';

const EMPTY: BillingData = {
  type: 'boleta',
  fullName: '',
  dni: '',
  ruc: '',
  businessName: '',
  fiscalAddress: '',
  email: '',
};

/** Datos de facturación: boleta (nombre y DNI) o factura (RUC, razón social y dirección fiscal), y el correo. */
export function DeliveryFacturacionScreen() {
  const colors = useDeliveryColors();
  const insets = useSafeAreaInsets();
  useStatusBarStyle('dark');

  const saved = useBillingStore((s) => s.data);
  const save = useBillingStore((s) => s.save);
  const [form, setForm] = React.useState<BillingData>(saved ?? EMPTY);
  const [errors, setErrors] = React.useState<BillingErrors>({});
  const { toast, show } = useToast();

  const set = (key: keyof BillingData) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const onSave = () => {
    const found = validateBilling(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    save(form);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    show({ icon: 'checkmark', title: 'Datos guardados', subtitle: `Tu ${form.type} llegará a ${form.email.trim()}` });
  };

  const types: { value: ReceiptType; label: string; hint: string }[] = [
    { value: 'boleta', label: 'Boleta', hint: 'Con tu DNI' },
    { value: 'factura', label: 'Factura', hint: 'Con RUC de tu empresa' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <DeliveryScreenHeader title="Datos de facturación" />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.intro, { color: colors.muted }]}>
            Enviaremos el comprobante electrónico de cada pedido a tu correo.
          </Text>

          <View style={styles.types} accessibilityRole="radiogroup">
            {types.map((item) => {
              const on = form.type === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => {
                    setForm((current) => ({ ...current, type: item.value }));
                    setErrors({});
                  }}
                  style={[
                    styles.type,
                    { backgroundColor: colors.card, borderColor: on ? colors.limeStrong : colors.line },
                    DeliveryShadow.card,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                >
                  <View style={[styles.radio, on ? { borderWidth: 6, borderColor: colors.limeStrong } : { borderColor: colors.faint }]} />
                  <View>
                    <Text style={[styles.typeLabel, { color: colors.ink }]}>{item.label}</Text>
                    <Text style={[styles.typeHint, { color: colors.muted }]}>{item.hint}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }, DeliveryShadow.card]}>
            {form.type === 'boleta' ? (
              <>
                <Field label="Nombre completo" placeholder="Ej.: Luis Ramírez Torres" value={form.fullName} onChangeText={set('fullName')} error={errors.fullName} autoCapitalize="words" />
                <Field label="DNI" placeholder="8 dígitos" value={form.dni} onChangeText={set('dni')} error={errors.dni} keyboardType="number-pad" maxLength={8} />
              </>
            ) : (
              <>
                <Field label="RUC" placeholder="11 dígitos" value={form.ruc} onChangeText={set('ruc')} error={errors.ruc} keyboardType="number-pad" maxLength={11} />
                <Field label="Razón social" placeholder="Ej.: Inversiones Lince S.A.C." value={form.businessName} onChangeText={set('businessName')} error={errors.businessName} />
                <Field label="Dirección fiscal" placeholder="Como figura en SUNAT" value={form.fiscalAddress} onChangeText={set('fiscalAddress')} error={errors.fiscalAddress} />
              </>
            )}
            <Field
              label="Correo para el comprobante"
              placeholder="tucorreo@ejemplo.com"
              value={form.email}
              onChangeText={set('email')}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
              last
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.line, paddingBottom: Math.max(24, insets.bottom) }]}>
        <Pressable onPress={onSave} style={[styles.save, { backgroundColor: colors.lime }]} accessibilityRole="button">
          <Text style={[styles.saveText, { color: colors.onLime }]}>Guardar datos</Text>
        </Pressable>
      </View>
      <DeliveryToast toast={toast} bottom={Math.max(24, insets.bottom) + 80} />
    </View>
  );
}

interface FieldProps extends TextInputProps {
  label: string;
  error?: string;
  last?: boolean;
}

function Field({ label, error, last, ...input }: FieldProps) {
  const colors = useDeliveryColors();
  return (
    <View style={[styles.field, !last && { borderBottomWidth: 1, borderBottomColor: colors.line }]}>
      <Text style={[styles.fieldLabel, { color: error ? colors.red : colors.muted }]}>{label}</Text>
      <TextInput
        {...input}
        placeholderTextColor={colors.faint}
        style={[styles.input, { color: colors.ink }]}
        accessibilityLabel={label}
      />
      {error ? <Text style={[styles.error, { color: colors.red }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingHorizontal: 14,
    gap: 12,
  },
  intro: {
    fontFamily: FontFamily.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  types: {
    flexDirection: 'row',
    gap: 10,
  },
  type: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  typeLabel: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
  },
  typeHint: {
    fontFamily: FontFamily.regular,
    fontSize: 11.5,
  },
  card: {
    borderRadius: 16,
    paddingHorizontal: 14,
  },
  field: {
    paddingVertical: 10,
    gap: 2,
  },
  fieldLabel: {
    fontFamily: FontFamily.medium,
    fontSize: 12,
  },
  input: {
    fontFamily: FontFamily.semibold,
    fontSize: 15,
    paddingVertical: 4,
  },
  error: {
    fontFamily: FontFamily.medium,
    fontSize: 11.5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 14,
    borderTopWidth: 1,
  },
  save: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    fontFamily: FontFamily.semibold,
    fontSize: 15.5,
  },
});
