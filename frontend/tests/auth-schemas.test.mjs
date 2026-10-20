import assert from "node:assert/strict";
import test from "node:test";

import { loginSchema } from "../src/modules/auth/login-schema.ts";
import { signupSchema } from "../src/modules/auth/signup-schema.ts";

test("signup accepts the required account fields", () => {
  const result = signupSchema.safeParse({
    name: "Taylor Saini",
    email: "taylor@example.test",
    password: "Aa1234567890",
  });

  assert.equal(result.success, true);
});

test("signup rejects short, oversized, and extra-field input", () => {
  const base = { name: "Taylor Saini", email: "taylor@example.test" };

  assert.equal(signupSchema.safeParse({ ...base, password: "short" }).success, false);
  assert.equal(signupSchema.safeParse({ ...base, password: "😀".repeat(19) }).success, false);
  assert.equal(
    signupSchema.safeParse({ ...base, password: "Aa1234567890", weddingId: "untrusted" }).success,
    false,
  );
});

test("login accepts trimmed email and rejects invalid credentials input", () => {
  assert.equal(
    loginSchema.safeParse({ email: "  taylor@example.test  ", password: "existing-password" }).success,
    true,
  );
  assert.equal(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success, false);
  assert.equal(loginSchema.safeParse({ email: "taylor@example.test", password: "" }).success, false);
});
