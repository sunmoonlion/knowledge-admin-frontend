'use client'

import { useQuery } from '@tanstack/react-query'

import { datasetVersionsSchema, registrySchema } from '@/contracts/dataset-registry'

import { getJson, seg } from './http'

const base = '/api/admin/v1/knowledge/datasets'

// 登记表：每个数据集和它的现行版本
export function useRegistry() {
  return useQuery({
    queryKey: ['knowledge', 'registry'],
    queryFn: () => getJson(registrySchema, base),
  })
}

// 一个数据集的各个版本。没选数据集就不取
export function useVersions(dataset: string | null) {
  return useQuery({
    queryKey: ['knowledge', 'registry', dataset, 'versions'],
    queryFn: () => getJson(datasetVersionsSchema, `${base}/${seg(dataset ?? '')}/versions`),
    enabled: dataset !== null,
  })
}
