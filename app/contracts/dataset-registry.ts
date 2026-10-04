// 数据集登记表的契约（管理面）。字段以 knowledge-backend `interfaces/schemas/catalog.py` 为真源。
// 这些写法由 `tests/unit/registry-contract-samples.test.ts` 对着样例（真后端录下来的返回）逐份检查。
import { z } from 'zod'

export const datasetVersionSchema = z
  .object({
    dataset_id: z.string(),
    data_version: z.string(),
    title: z.string(),
    security_code: z.string().nullable(),
    status: z.enum(['active', 'superseded']),
    start_date: z.string(),
    end_date: z.string(),
    sha256: z.string(),
    size_bytes: z.number().int(),
    // 存放位置：只有管理端看得到
    bucket: z.string(),
    object_key: z.string(),
    object_version_id: z.string().nullable(),
    source_app: z.string(),
    source_ref: z.string().nullable(),
    registered_by: z.string(),
    registered_at: z.string(),
    // 被取代的版本：它被取代的时间
    superseded_at: z.string().nullable(),
    // 文件取回到本地没有。取回时按校验值核对过才算取回
    fetched: z.boolean(),
  })
  .loose()
export type DatasetVersion = z.infer<typeof datasetVersionSchema>

export const registrySchema = z
  .object({
    // 多数据集开没开。没开时登记表是空的
    enabled: z.boolean(),
    datasets: z.array(
      z
        .object({
          dataset_id: z.string(),
          title: z.string(),
          security_code: z.string().nullable(),
          current: datasetVersionSchema.nullable(),
          version_count: z.number().int(),
        })
        .loose(),
    ),
  })
  .loose()
export type Registry = z.infer<typeof registrySchema>

export const datasetVersionsSchema = z
  .object({ dataset_id: z.string(), versions: z.array(datasetVersionSchema) })
  .loose()
