'use client'

import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { catalogDatasetSchema, catalogListSchema } from '@/contracts/catalog'
import { AdminReadError, readJson, seg } from '@/lib/api/read-json'

const base = '/api/admin/v1/knowledge/catalog/datasets'

// 公共库里现有的数据集。和专家、代理用工具查到的是同一份
export function useDatasets(query: string) {
  return useQuery({
    queryKey: ['knowledge', 'catalog', 'datasets', query],
    queryFn: () =>
      readJson(catalogListSchema, query ? `${base}?q=${encodeURIComponent(query)}` : base),
    placeholderData: keepPreviousData,
  })
}

// 一个数据集的结构
export function useDataset(dataset: string) {
  return useQuery({
    queryKey: ['knowledge', 'catalog', 'dataset', dataset],
    queryFn: () => readJson(catalogDatasetSchema, `${base}/${seg(dataset)}`),
  })
}

export function isNotFound(error: unknown) {
  return error instanceof AdminReadError && error.code === 'not_found'
}
