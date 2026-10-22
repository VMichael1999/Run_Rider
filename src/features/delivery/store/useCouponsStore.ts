import { create } from 'zustand';
import { ACCOUNT_COUPONS, REDEEMABLE_CODES, type AccountCoupon } from '../data/account';

export type RedeemResult = 'agregado' | 'repetido' | 'invalido';

interface CouponsState {
  coupons: AccountCoupon[];
  redeem: (code: string) => RedeemResult;
}

/** Cupones de la cuenta; se pueden agregar códigos a mano. */
export const useCouponsStore = create<CouponsState>((set, get) => ({
  coupons: ACCOUNT_COUPONS,
  redeem: (raw) => {
    const code = raw.trim().toUpperCase();
    if (get().coupons.some((coupon) => coupon.code === code)) return 'repetido';
    const found = REDEEMABLE_CODES[code];
    if (!found) return 'invalido';
    set((state) => ({ coupons: [{ ...found, id: code.toLowerCase(), code, state: 'disponible' }, ...state.coupons] }));
    return 'agregado';
  },
}));
