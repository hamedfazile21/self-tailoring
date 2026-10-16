/**
 * Every settings key the client reads or writes, in one place.
 *
 * Settings live in a shared key/value table, so a mistyped key is a silently
 * missing setting rather than a compile error — going through these constants
 * is what keeps the reader and the writer agreeing on a name.
 */
export const SETTING_KEYS = {
  /**
   * Which columns the customers table shows, stored as a JSON visibility map
   * (`{ "<columnId>": boolean }`). The `value` column is a `varchar(255)`,
   * which the handful of customer columns fits inside comfortably.
   */
  customerTableView: 'customer-view-table',

  /** The same, for the orders table. */
  orderTableView: 'order-view-table',
} as const

export type SettingKey = (typeof SETTING_KEYS)[keyof typeof SETTING_KEYS]
