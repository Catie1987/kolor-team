'use client'

import { useState } from "react";
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
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
  FieldSeparator,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import logo from "@/assets/logo/logo-small.png";
import meeting from "@/assets/image/meeting.jpg"
import Image from 'next/image';
import Link from "next/link";
import { EyeOff, Eye } from 'lucide-react';

export default function Page() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = async (formData: FormData) => {
    const emailAddress = formData.get('email') as string
    const password = formData.get('password') as string
    

    const { error } = await signIn.password({
      emailAddress,
      password,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }

          // If no session tasks, navigate the signed-in user to the home page
          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    } else if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else if (signIn.status === 'needs_client_trust') {
      // For other second factor strategies,
      // see https://clerk.com/docs/guides/development/custom-flows/authentication/client-trust
      const emailCodeFactor = signIn.supportedSecondFactors.find(
        (factor) => factor.strategy === 'email_code',
      )

      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode()
      }
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  const handleVerify = async (formData: FormData) => {
    const code = formData.get('code') as string

    await signIn.mfa.verifyEmailCode({ code })

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          // Handle session tasks
          // See https://clerk.com/docs/guides/development/custom-flows/authentication/session-tasks
          if (session?.currentTask) {
            console.log(session?.currentTask)
            return
          }

          // If no session tasks, navigate the signed-in user to the home page
          const url = decorateUrl('/')
          if (url.startsWith('http')) {
            window.location.href = url
          } else {
            router.push(url)
          }
        },
      })
    } else {
      // Check why the sign-in is not complete
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  if (signIn.status === 'needs_client_trust') {
    return (
        <GridLayout>
      <div className="flex min-h-svh w-full items-center justify-center p-6">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Verify your account</CardTitle>
            <CardDescription>
              Enter the code we sent to your email to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleVerify} className="flex flex-col gap-5">
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input id="code" name="code" type="text" autoComplete="one-time-code" />
                {errors.fields.code && (
                  <p className="text-sm text-destructive">{errors.fields.code.message}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={fetchStatus === 'fetching'}>
                Verify
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => signIn.mfa.sendEmailCode()}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  I need a new code
                </button>
                <button
                  type="button"
                  onClick={() => signIn.reset()}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  Start over
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </GridLayout>
    )
}

  return (
    <GridLayout>
        <div className="flex min-h-svh w-full items-center justify-center p-6">
            <div className="w-full max-w-sm md:max-w-4xl">
                <div className="flex flex-col gap-6">
                    <Card className="overflow-hidden p-0">
                        <CardContent className="grid p-0 md:grid-cols-2">
                        <form action={handleSubmit} className="p-6 md:p-8">
                            <FieldGroup>
                                <div className='w-full flex gap-4 items-center justify-center'>
                                    <Link href='./'>
                                      <Image alt='logo' src={logo} width='70' height='40'/>
                                    </Link>
                                    <h1 className='md:text-lg font-semibold'>KISCO (VIETNAM) LTD</h1>
                                </div>
                                <div className="flex flex-col items-center gap-2 text-center">
                                    <h1 className="text-2xl font-bold">Welcome back</h1>
                                    <p className="text-balance text-muted-foreground">
                                    Login to your Kisco Dashboard account
                                    </p>
                                </div>
                                <Field>
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <InputGroup className="max-w-sm w-full bg-white">
                                    <InputGroupInput 
                                        placeholder="ksv@example.com" 
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                    />
                                    </InputGroup>
                                </Field>
                                <Field>
                                    <div className="flex items-center">
                                        <FieldLabel htmlFor="password">Password</FieldLabel>
                                        <a
                                            href="./forgot-password"
                                            className="ml-auto text-sm underline-offset-2 hover:underline"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <InputGroup className="max-w-sm w-full bg-white">
                                    <InputGroupInput 
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        autoComplete="current-password"
                                        name="password"
                                        required
                                    />
                                    <InputGroupAddon align="inline-end">
                                      <Button variant='ghost' 
                                      className='border bg-transparent hover:bg-transparent h-8 w-6 size-4'
                                      onClick={() => setShowPassword((prev) => !prev)}
                                      >
                                        {showPassword ? (<EyeOff/>): (<Eye/>)}
                                        
                                      </Button>
                                    </InputGroupAddon>
                                    </InputGroup>
                                    {errors.fields.password && (
                                        <p className="text-sm text-destructive">{errors.fields.password.message}</p>
                                    )}
                                </Field>
                                <Field>
                                    <Button type="submit" disabled={fetchStatus === 'fetching'}>
                                        {fetchStatus === 'fetching' ? 'Signing in...' : 'Continue'}
                                    </Button>
                                </Field>
                                <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card"/>
                                <FieldDescription className="text-center">
                                    Don&apos;t have an account? <a href="/waitlist">Request to join</a>
                                </FieldDescription>
                            </FieldGroup>
                        </form>

                        <div className="relative hidden bg-muted md:block">
                            <Image
                            src={meeting}
                            alt="Meeting"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
                            />
                        </div>
                        </CardContent>
                    </Card>
                    <FieldDescription className="px-6 text-center">
                        This is confidental data from Kisco Vietnam Ltd and only purpose for sales meeting.
                    </FieldDescription>
                    <div className='mb-6 text-muted-foreground flex items-center gap-2 w-full justify-center'>
                          <Button variant='link'>  
                            <Link href="./" className='text-sm'>
                            Back to Homepage
                            </Link>
                        </Button> 
                    </div>
                </div>
            </div>
        </div>
    </GridLayout>
  )
}