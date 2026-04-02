import { headers } from 'next/headers'
import WealthWiredPage from './WealthWiredClient'

export default async function Page() {
  await headers()
  return <WealthWiredPage />
}
