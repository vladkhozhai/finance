/**
 * Common utility types
 */

/**
 * Make certain keys of T optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make certain keys of T required
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Extract the element type from an array type
 */
export type ArrayElement<T extends readonly unknown[]> =
  T extends readonly (infer E)[] ? E : never;

/**
 * Make all properties in T nullable
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/**
 * Make all properties in T and nested objects deeply partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Make all properties in T and nested objects deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Extract keys from T where value matches type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Create a type with only specific keys from T
 */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>;

/**
 * Common entity with ID and timestamps
 */
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Common entity with soft delete support
 */
export interface SoftDeletableEntity extends BaseEntity {
  deletedAt: string | null;
}

/**
 * Branded type for type-safe IDs
 */
export type Brand<T, B extends string> = T & { __brand: B };

/**
 * UUID branded type
 */
export type UUID = Brand<string, "UUID">;

/**
 * ISO date string branded type
 */
export type ISODateString = Brand<string, "ISODateString">;

/**
 * Currency code (ISO 4217) branded type
 */
export type CurrencyCode = Brand<string, "CurrencyCode">;

/**
 * Common async operation result
 */
export type AsyncResult<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };
