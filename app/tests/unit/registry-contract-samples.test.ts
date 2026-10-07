// 管理端的契约对着样例检查。样例是 knowledge 后端的测试在测试库里登记了几个版本之后，把管理接口的真实返回录下来的。
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { datasetVersionsSchema, registrySchema } from '@/contracts/dataset-registry'
import { bytes, isCurrent, locationOf, shortHash } from '@/features/registry/model/registry'

const fixtures = join(process.cwd(), 'preview/fixtures')
type Manifest = {
  responses: { method: string; path: string; query: string; status: number; file: string }[]
}
function sampled(scenario: string) {
  const dir = join(fixtures, scenario)
  const manifest = JSON.parse(readFileSync(join(dir, 'manifest.json'), 'utf8')) as Manifest
  return manifest.responses.map((response) => ({
    ...response,
    body: JSON.parse(readFileSync(join(dir, response.file), 'utf8')) as unknown,
  }))
}
const LIST = '/api/admin/v1/knowledge/datasets'

// 登记表的情景；目录的情景（catalog…）由 catalog-contract-samples 检查
const scenarios = readdirSync(fixtures).filter((name) => !name.startsWith('catalog'))

describe('契约认得样例里的每一份返回', () => {
  it.each(scenarios)('情景 %s', (scenario) => {
    const ok = sampled(scenario).filter((each) => each.status === 200)
    expect(ok.length).toBeGreaterThan(0)
    for (const each of ok) {
      const schema = each.path === LIST ? registrySchema : datasetVersionsSchema
      const parsed = schema.safeParse(each.body)
      expect(parsed.success ? null : `${each.path}: ${parsed.error.message}`).toBeNull()
    }
  })
})

describe('登记表', () => {
  const registry = registrySchema.parse(sampled('full').find((each) => each.path === LIST)!.body)
  const history = datasetVersionsSchema.parse(
    sampled('full').find((each) => each.path === `${LIST}/sh600009-financials/versions`)!.body,
  )

  it('每个数据集有一个现行版本，知道一共几个版本', () => {
    expect(registry.enabled).toBe(true)
    expect(registry.datasets.map((each) => [each.dataset_id, each.version_count])).toEqual([
      ['sh600009-financials', 2],
      ['sh600519-financials', 1],
    ])
    expect(registry.datasets.every((each) => each.current && isCurrent(each.current))).toBe(true)
  })

  it('历史里现行的排最前，被取代的有时间（AT-KNOW-02）', () => {
    expect(history.versions.map((each) => each.status)).toEqual(['active', 'superseded'])
    expect(history.versions[0].superseded_at).toBeNull()
    expect(history.versions[1].superseded_at).not.toBeNull()
  })

  it('没打开多数据集：登记表是空的', () => {
    expect(registrySchema.parse(sampled('off')[0].body)).toMatchObject({
      enabled: false,
      datasets: [],
    })
  })

  it('存放位置、校验值、大小的写法', () => {
    const current = registry.datasets[0].current!
    expect(locationOf(current)).toBe(
      's3://development-info-originals/info/securities/code=600009/datasets/sh600009-financials-9fd91db79529e208/sh600009-financials.sqlite',
    )
    expect(shortHash(current.sha256)).toHaveLength(12)
    expect(current.sha256.startsWith(shortHash(current.sha256))).toBe(true)
    expect(bytes(512)).toBe('512 B')
    expect(bytes(151552)).toBe('148.0 KB')
    expect(bytes(3 * 1024 * 1024)).toBe('3.0 MB')
  })
})
