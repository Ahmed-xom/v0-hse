import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { hashPassword, verifyPassword } from "@better-auth/utils/password"

const oldPassword = "Old-password-for-test-only-123!"
const newPassword = "New-password-for-test-only-456!"
const storedHash = await hashPassword(newPassword)

assert.equal(await verifyPassword(storedHash, newPassword), true, "the new password must verify")
assert.equal(await verifyPassword(storedHash, oldPassword), false, "the old password must not verify")
assert.match(storedHash, /^[^:]+:[0-9a-f]+$/, "the stored value must use Better Auth's scrypt format")

const passwordPaths = [
  "app/actions/add-user.ts",
  "app/actions/forgot-password.ts",
  "app/actions/manage-users.ts",
  "app/actions/reset-password.ts",
  "app/actions/password-reset-otp.ts",
  "scripts/provision-users.mjs",
  "scripts/send-reset-email.mjs",
]
for (const path of passwordPaths) {
  const source = await readFile(new URL(`../${path}`, import.meta.url), "utf8")
  assert.match(source, /hashPassword/, `${path} must use Better Auth hashPassword`)
  if (path !== "app/actions/password-reset-otp.ts") {
    assert.doesNotMatch(source, /bcrypt(?:js)?|bcrypt\.hash|bcrypt\.compare/, `${path} must not create Better Auth password credentials with bcrypt`)
  } else {
    assert.match(source, /bcrypt\.hash\(otp/, "OTP may use bcrypt for its separate OTP digest")
    assert.doesNotMatch(source, /bcrypt\.hash\(newPassword/, "password credentials must not use the OTP bcrypt helper")
  }
}

console.log("Password reset compatibility passed: native hash accepted, wrong password rejected, and password-writing paths use Better Auth hashing.")
