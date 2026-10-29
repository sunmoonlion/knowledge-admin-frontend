import { z } from 'zod'

// 管理端看用户资料（后端 /api/admin/v1/user-data，SDD 0044 第四节）。答复一律过 zod。

export const usageSchema = z.object({
  quota_bytes: z.number().int(),
  users: z.array(
    z.object({ subject: z.string(), bytes_used: z.number().int(), materials: z.number().int() }),
  ),
})

export const adminVocabularySchema = z.object({
  version: z.number().int(),
  vocabulary: z.object({
    version: z.number().int(),
    doc_classes: z.record(z.string(), z.object({ name: z.string(), publisher: z.string() })),
    doc_types: z.record(z.string(), z.object({ name: z.string(), class: z.string() })),
    editions: z.record(z.string(), z.string()),
    topics: z.record(z.string(), z.string()),
    industries: z.array(z.string()),
    languages: z.record(z.string(), z.string()),
    formats: z.record(z.string(), z.string()),
  }),
  descriptions: z.array(
    z.object({
      vocab_version: z.number().int().nullable(),
      status: z.string(),
      doc_type: z.string().nullable(),
      count: z.number().int(),
    }),
  ),
})

export const adminMaterialSchema = z.object({
  material_id: z.string(),
  owner: z.string(),
  name: z.string(),
  content_origin: z.string(),
  license: z.string(),
  doc_type: z.string().nullable(),
  description_status: z.string(),
  vocab_version: z.number().int(),
  current_version: z.number().int(),
  created_at: z.string(),
  deleted_at: z.string().nullable(),
  disabled_at: z.string().nullable(),
})

export const deletionSchema = z.object({
  id: z.string(),
  material_id: z.string().nullable(),
  action: z.string(),
  reason: z.string(),
  state: z.string(),
  pending: z.array(z.string()),
})

export const purgeSchema = z.object({ purged: z.boolean(), result: z.string() })

export type Usage = z.infer<typeof usageSchema>
export type AdminVocabulary = z.infer<typeof adminVocabularySchema>
export type AdminMaterial = z.infer<typeof adminMaterialSchema>
export type Deletion = z.infer<typeof deletionSchema>
