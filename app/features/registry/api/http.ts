// 登记表只有读：用公共的只读收发（lib/api/read-json）。
export { AdminReadError as RegistryError, readJson as getJson, seg } from '@/lib/api/read-json'
