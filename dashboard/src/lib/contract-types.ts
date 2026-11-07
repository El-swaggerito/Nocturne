export type YoctoNear = string;

export type PolicyView = {
  frozen: boolean;
  daily_limit: YoctoNear;
  per_transaction_limit: YoctoNear;
  approved_recipients: string[];
  current_utc_day: number;
};

export type PaymentView = {
  request_id: string;
  recipient_id: string;
  amount_yocto: YoctoNear;
  invoice_reference: string;
  utc_day: number;
  status: string;
};

export type SpendingView = {
  utc_day: number;
  daily_committed: YoctoNear;
  pending_total: YoctoNear;
  daily_limit: YoctoNear;
  remaining_daily: YoctoNear;
  recorded_payments: number;
};

export type GuardViewMethods = {
  get_owner: () => Promise<string>;
  get_agent: () => Promise<string>;
  is_frozen: () => Promise<boolean>;
  get_next_request_id: () => Promise<string>;
  get_policy: () => Promise<PolicyView>;
  get_payment: (args: { request_id: string }) => Promise<PaymentView | null>;
  get_spending: () => Promise<SpendingView>;
};
