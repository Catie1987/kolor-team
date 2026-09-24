import { Suspense } from 'react'
import GridLayout from '@/components/grid-layout'
import { LoaderIcon } from 'lucide-react'
import SignUpContent from './sign-up-content'

export default function Page() {
  return (
    <Suspense
      fallback={
        <GridLayout>
          <div className="flex min-h-svh w-full items-center justify-center p-6">
            <LoaderIcon className="animate-spin size-6 text-muted-foreground" />
          </div>
        </GridLayout>
      }
    >
      <SignUpContent />
    </Suspense>
  )
}