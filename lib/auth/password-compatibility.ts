import bcrypt from 'bcryptjs'
import { verifyPassword } from '@better-auth/utils/password'

export async function verifyCompatiblePassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  try {
    if (/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(hash)) {
      return await bcrypt.compare(password, hash)
    }
    return await verifyPassword(hash, password)
  } catch {
    return false
  }
}
