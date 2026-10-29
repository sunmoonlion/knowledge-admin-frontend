'use client'

// 用户资料的管理取数：同源 /api/admin/v1/user-data；看用只读收发，禁用、清除带 CSRF。
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminMaterialSchema,
  adminVocabularySchema,
  deletionSchema,
  purgeSchema,
  usageSchema,
} from '@/contracts/user-data'
import { requestJson } from '@/lib/api/client'
import { readJson, seg } from '@/lib/api/read-json'

const BASE = '/api/admin/v1/user-data'
const root = ['knowbase', 'user-data'] as const

export function useUsage() {
  return useQuery({
    queryKey: [...root, 'usage'],
    queryFn: () => readJson(usageSchema, `${BASE}/usage`),
  })
}

export function useVocabulary() {
  return useQuery({
    queryKey: [...root, 'vocabulary'],
    queryFn: () => readJson(adminVocabularySchema, `${BASE}/vocabulary`),
  })
}

// 不给条件就不取：后端要所有者、编号或「只看禁用」之一
export function useMaterials(query: string | null) {
  return useQuery({
    queryKey: [...root, 'materials', query],
    queryFn: () => readJson(adminMaterialSchema.array(), `${BASE}/materials?${query}`),
    enabled: query !== null,
  })
}

export function useDeletions(materialId: string | null) {
  return useQuery({
    queryKey: [...root, 'deletions', materialId],
    queryFn: () =>
      readJson(deletionSchema.array(), `${BASE}/materials/${seg(materialId ?? '')}/deletions`),
    enabled: materialId !== null,
  })
}

export function useDispose(csrfToken: string) {
  const client = useQueryClient()
  const refresh = () => client.invalidateQueries({ queryKey: root })
  const disable = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      requestJson(`${BASE}/materials/${seg(id)}/disable`, {
        method: 'POST',
        body: { reason },
        csrfToken,
      }),
    onSuccess: refresh,
  })
  const purge = useMutation({
    mutationFn: async ({
      id,
      reason,
      personalInfo,
    }: {
      id: string
      reason: string
      personalInfo: boolean
    }) =>
      purgeSchema.parse(
        await requestJson(`${BASE}/materials/${seg(id)}/purge`, {
          method: 'POST',
          body: { reason, personal_info: personalInfo },
          csrfToken,
        }),
      ),
    onSuccess: refresh,
  })
  return { disable, purge }
}
