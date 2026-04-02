import { headers } from 'next/headers'
import PremiumPositionPage from './PremiumPositionClient'

export default async function Page() {
  await headers()
  return <PremiumPositionPage />
}
