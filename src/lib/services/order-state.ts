export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_VERIFICATION'
  | 'PAYMENT_REJECTED'
  | 'PAYMENT_APPROVED'
  | 'PRODUCT_SENT'
  | 'COMPLETED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED';

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['WAITING_VERIFICATION', 'EXPIRED', 'CANCELLED'],
  WAITING_VERIFICATION: ['PAYMENT_APPROVED', 'PAYMENT_REJECTED', 'CANCELLED'],
  PAYMENT_REJECTED: ['WAITING_VERIFICATION', 'CANCELLED', 'EXPIRED'],
  PAYMENT_APPROVED: ['PRODUCT_SENT', 'REFUNDED', 'CANCELLED'],
  PRODUCT_SENT: ['COMPLETED', 'REFUNDED', 'CANCELLED'],
  COMPLETED: ['REFUNDED'],
  EXPIRED: ['PENDING_PAYMENT', 'CANCELLED'],
  CANCELLED: [],
  REFUNDED: [],
};

/**
 * Check if a state transition is valid according to PRD business rules.
 */
export function isValidStatusTransition(current: OrderStatus, target: OrderStatus): boolean {
  if (current === target) return true; // No-op transition
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(target);
}

/**
 * Validate and throw error if invalid transition.
 */
export function assertValidStatusTransition(current: OrderStatus, target: OrderStatus): void {
  if (!isValidStatusTransition(current, target)) {
    throw new Error(`Invalid status transition from ${current} to ${target}`);
  }
}
