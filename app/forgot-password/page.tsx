import GridLayout from '@/components/grid-layout'
import ForgotPassword from './forgot-password'

export default function Page() {
  return (
    <GridLayout>
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <ForgotPassword />
      </div>
    </GridLayout>
  )
}