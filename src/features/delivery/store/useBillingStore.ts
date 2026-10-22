import { create } from 'zustand';

export type ReceiptType = 'boleta' | 'factura';

export interface BillingData {
  type: ReceiptType;
  fullName: string;
  dni: string;
  ruc: string;
  businessName: string;
  fiscalAddress: string;
  email: string;
}

interface BillingState {
  data: BillingData | null;
  save: (data: BillingData) => void;
}

export const useBillingStore = create<BillingState>((set) => ({
  data: null,
  save: (data) => set({ data }),
}));

export type BillingErrors = Partial<Record<keyof BillingData, string>>;

/** Valida lo que pide SUNAT para cada comprobante (DNI de 8 dígitos, RUC de 11 que empieza en 10 o 20). */
export function validateBilling(data: BillingData): BillingErrors {
  const errors: BillingErrors = {};
  if (!/^\S+@\S+\.\S+$/.test(data.email.trim())) errors.email = 'Ingresa un correo válido.';
  if (data.type === 'boleta') {
    if (data.fullName.trim().length < 3) errors.fullName = 'Ingresa tu nombre completo.';
    if (!/^\d{8}$/.test(data.dni)) errors.dni = 'El DNI tiene 8 dígitos.';
  } else {
    if (!/^(10|20)\d{9}$/.test(data.ruc)) errors.ruc = 'El RUC tiene 11 dígitos y empieza en 10 o 20.';
    if (data.businessName.trim().length < 3) errors.businessName = 'Ingresa la razón social.';
    if (data.fiscalAddress.trim().length < 5) errors.fiscalAddress = 'Ingresa la dirección fiscal.';
  }
  return errors;
}
