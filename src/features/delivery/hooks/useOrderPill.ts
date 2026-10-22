import { useActiveOrderStore } from '../store/useActiveOrderStore';
import { useOrderSimulation } from './useOrderSimulation';
import { formatClock } from '../utils/orderSimulation';
import { ACTIVE_ORDER, type ActiveOrderStatus } from '../data/mock';

export interface OrderPillData {
  status: ActiveOrderStatus;
  minutes: number;
  arrivesAt: string;
  /** Hay un pedido real que se puede abrir; si no, es el del mockup (del-03). */
  live: boolean;
}

/** Pedido en curso que muestra el accessory: el real si hay uno; si no, el del mockup. Null al entregarse. */
export function useOrderPill(): OrderPillData | null {
  const order = useActiveOrderStore((s) => s.order);
  const sim = useOrderSimulation(order?.startedAt ?? null);

  if (!order) {
    return {
      status: ACTIVE_ORDER.status,
      minutes: ACTIVE_ORDER.minutesLeft[ACTIVE_ORDER.status],
      arrivesAt: ACTIVE_ORDER.arrivesAt,
      live: false,
    };
  }
  if (!sim || sim.phase === 'entregado') return null;
  return {
    status: sim.phase === 'recogido' || sim.phase === 'en-camino' ? 'en-camino' : 'preparando',
    minutes: sim.minutesLeft,
    arrivesAt: formatClock(new Date(order.startedAt + 20 * 60000)),
    live: true,
  };
}
