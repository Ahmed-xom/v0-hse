import assert from "node:assert/strict"
import { hashPassword, verifyPassword } from "@better-auth/utils/password"

const oldPassword = "Old-password-for-test-only-123!"
const newPassword = "New-password-for-test-only-456!"
const storedHash = await hashPassword(newPassword)

assert.equal(await verifyPassword(storedHash, newPassword), true, "the new password must verify")
assert.equal(await verifyPassword(storedHash, oldPassword), false, "the old password must not verify")
assert.match(storedHash, /^[^:]+:[0-9a-f]+$/, "the stored value must use Better Auth's scrypt format")
console.log("Password reset compatibility passed: new password accepted; old password rejected.")
