/**
 * Test user helper utilities
 * Generates unique test users to avoid collisions
 */

export interface TestUser {
  email: string;
  password: string;
  currency: string;
}

/**
 * Generate a unique test user with timestamp
 */
export function generateTestUser(): TestUser {
  const timestamp = Date.now();
  return {
    email: `test-${timestamp}@example.com`,
    password: "SecurePass123!",
    currency: "USD",
  };
}

/**
 * Generate multiple unique test users
 */
export function generateTestUsers(count: number): TestUser[] {
  return Array.from({ length: count }, (_, i) => ({
    email: `test-${Date.now()}-${i}@example.com`,
    password: "SecurePass123!",
    currency: "USD",
  }));
}

/**
 * Test user with invalid data for validation testing
 */
export const invalidTestUsers = {
  invalidEmail: {
    email: "not-an-email",
    password: "SecurePass123!",
    currency: "USD",
  },
  weakPassword: {
    email: "test@example.com",
    password: "123",
    currency: "USD",
  },
  emptyFields: {
    email: "",
    password: "",
    currency: "",
  },
};
