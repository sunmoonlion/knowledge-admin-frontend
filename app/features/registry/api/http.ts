// 管理接口的收发。同源 /api/admin；登记表只有读；答复一律过 zod。
import { z } from 'zod'

export class RegistryError extends Error {
  constructor(
    public readonly code: 'backend_unavailable' | 'contract_invalid' | 'request_failed',
    public readonly status?: number,
  ) {
    super(code)
    this.name = 'RegistryError'
  }
}

export async function getJson<T>(schema: z.ZodType<T>, path: string): Promise<T> {
  if (!path.startsWith('/api/admin/')) throw new Error('admin path expected')
  let response: Response
  try {
    response = await fetch(path, {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'manual',
      headers: { Accept: 'application/json' },
    })
  } catch {
    throw new RegistryError('backend_unavailable')
  }
  if (!response.ok || response.type === 'opaqueredirect') {
    throw new RegistryError('request_failed', response.status)
  }
  const parsed = schema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) throw new RegistryError('contract_invalid', response.status)
  return parsed.data
}

export const seg = (value: string) => encodeURIComponent(value)
