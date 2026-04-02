import { headers } from 'next/headers'
import PlaybookPage from './PlaybookClient'

export default async function Page() {
  await headers()
  return <PlaybookPage />
}
