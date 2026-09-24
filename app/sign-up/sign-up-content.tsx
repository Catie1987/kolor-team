'use client'

import { useEffect, useState } from "react";
import { useSignUp } from '@clerk/nextjs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import GridLayout from '@/components/grid-layout'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import logo from "@/assets/logo/logo-small.png";
import Image from 'next/image';
import Link from "next/link";
import { LoaderIcon, EyeOff, Eye, AlertCircleIcon } from 'lucide-react';


export default function Page() {
  const { signUp, errors, fetchStatus } = useSignUp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ticket = searchParams.get('__clerk_ticket')

  const [showPassword, setShowPassword] = useState(false)
  // 'verifying' -> checking the ticket | 'needs_password' -> collect password
  // 'invalid' -> no/bad ticket | 'ready' -> waiting on user submit
  const [stage, setStage] = useState<'verifying' | 'needs_password' | 'invalid'>('verifying')

  // Step 1: verify the invitation ticket as soon as the page loads
  useEffect(() => {
    if (!ticket) {
      setStage('invalid')
      return
    }

    const acceptInvite = async () => {
      const { error } = await signUp.create({ strategy: 'ticket', ticket })

      if (error) {
        console.error('Ticket verification failed:', JSON.stringify(error, null, 2))
        setStage('invalid')
        return
      }

      if (signUp.status === 'complete') {
        await finalizeSignUp()
      } else {
        // Account needs a password (or other missing fields) before it's complete
        setStage('needs_password')
      }
    }

    acceptInvite()
  }, [ticket])

  const finalizeSignUp = async () => {
    await signUp.finalize({
      navigate: ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          console.log(session?.currentTask)
          return
        }
        const url = decorateUrl('/')
        if (url.startsWith('http')) {
          window.location.href = url
        } else {
          router.push(url)
        }
      },
    })
  }

  const handleSubmit = async (formData: FormData) => {
    const password = formData.get('password') as string

    const { error } = await signUp.update({ password } as any)
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signUp.status === 'complete') {
      await finalizeSignUp()
    } else {
      console.error('Sign-up attempt not complete:', signUp)
    }
  }

  // ---- Invalid / missing ticket ----
  if (stage === 'invalid') {
    return (
      <GridLayout>
        <div className="flex min-h-svh w-full items-center justify-center p-6 flex-col gap-6">
          <Card className="w-full max-w-sm">
            <CardHeader>
                <div className='flex gap-2'>
                    <AlertCircleIcon className="size-7 text-destructive h-7" />
                    <div className='mt-0.5'>
                        <p className='text-destructive text-base font-semibold'>Invitation required</p>
                        <span className='text-sm text-muted-foreground'>This link is invalid or has expired. You&apos;ll need a valid invitation to create an account.</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                <a
                    href="/waitlist"
                    className="text-sm underline-offset-2 hover:underline hover:text-primary ml-6"
                >
                    Request access
                </a>
                <a href="/sign-in" className="text-sm underline-offset-2 hover:underline hover:text-primary ml-6">Back to sign in</a>
            </CardContent>
          </Card>
            <div className='mb-6 text-muted-foreground flex items-center gap-2 w-full justify-center'>
                <Button variant='link'>  
                    <Link href="./" className='text-sm'>
                    Back to Homepage
                    </Link>
                </Button> 
            </div>
        </div>
      </GridLayout>
    )
  }

  // ---- Verifying ticket ----
  if (stage === 'verifying') {
    return (
      <GridLayout>
        <div className="flex min-h-svh w-full items-center justify-center p-6">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <LoaderIcon className="animate-spin size-6" />
            <p>Verifying your invitation...</p>
          </div>
          {/* Must exist in the DOM before signUp.create() runs in the useEffect above */}
          <div id="clerk-captcha" />
        </div>
      </GridLayout>
    )
  }

  // ---- Needs password to finish account setup ----
  return (
    <GridLayout>
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardContent className="p-6 md:p-8">
            <form action={handleSubmit}>
              <FieldGroup>
                <div className='w-full flex gap-4 items-center justify-center'>
                  <Link href='./'>
                    <Image alt='logo' src={logo} width='70' height='40' />
                  </Link>
                  <h1 className='md:text-lg font-semibold'>KISCO (VIETNAM) LTD</h1>
                </div>
                <div className="flex flex-col items-center gap-2 text-center">
                  <h1 className="text-2xl font-bold">Set up your account</h1>
                  <p className="text-balance text-muted-foreground">
                    You&apos;ve been approved. Choose a password to finish setting up your account.
                  </p>
                </div>
                <Field>
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      className='focus-visible:ring-1'
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 bg-transparent hover:bg-transparent"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </div>
                  {errors?.fields?.password && (
                    <p className="text-sm text-destructive">{errors.fields.password.message}</p>
                  )}
                </Field>
                {/* Clerk's CAPTCHA widget */}
                <div id="clerk-captcha" />

                <Field>
                  <Button type="submit" disabled={fetchStatus === 'fetching'}>
                    {fetchStatus === 'fetching' ? 'Creating account...' : 'Continue'}
                  </Button>
                </Field>
                <FieldDescription className="text-center">
                  Already have an account? <Link href="/sign-in">Sign in</Link>
                </FieldDescription>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </GridLayout>
  )
}