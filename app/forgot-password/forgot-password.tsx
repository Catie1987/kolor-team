'use client'

import { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group'
import { EyeOff, Eye } from 'lucide-react'
import Link from 'next/link'

export default function ForgotPassword() {
  const { signIn, errors, fetchStatus } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  // Step 1: Send the password reset code to the user's email
  async function sendCode(e: React.FormEvent) {
    e.preventDefault()

    const { error: createError } = await signIn.create({
      identifier: emailAddress,
    })
    if (createError) {
      console.error(JSON.stringify(createError, null, 2))
      return
    }

    const { error: sendCodeError } = await signIn.resetPasswordEmailCode.sendCode()
    if (sendCodeError) {
      console.error(JSON.stringify(sendCodeError, null, 2))
      return
    }

    setCodeSent(true)
  }

  // Step 2: Verify the code provided by the user
  async function verifyCode(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }
  }

  // Step 3: Submit the new password
  async function submitNewPassword(e: React.FormEvent) {
    e.preventDefault()

    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    })
    if (error) {
      console.error(JSON.stringify(error, null, 2))
      return
    }

    if (signIn.status === 'complete') {
      const { error: finalizeError } = await signIn.finalize({
        navigate: async ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            console.log(session.currentTask)
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

      if (finalizeError) {
        console.error(JSON.stringify(finalizeError, null, 2))
      }
    } else if (signIn.status === 'needs_second_factor') {
      // See https://clerk.com/docs/guides/development/custom-flows/authentication/multi-factor-authentication
    } else {
      console.error('Sign-in attempt not complete:', signIn)
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          {!codeSent && "Enter your email and we'll send you a reset code."}
          {codeSent && signIn.status !== 'needs_new_password' &&
            'Enter the code we sent to your email.'}
          {signIn.status === 'needs_new_password' && 'Choose a new password.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Step 1: Email */}
        {!codeSent && (
          <form onSubmit={sendCode}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="emailAddress">Email</FieldLabel>
                <InputGroup className="w-full bg-white">
                  <InputGroupInput
                    id="emailAddress"
                    type="email"
                    placeholder="ksv@example.com"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    required
                  />
                </InputGroup>
                {errors?.fields?.identifier && (
                  <p className="text-sm text-destructive">{errors.fields.identifier.message}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={fetchStatus === 'fetching'}>
                  {fetchStatus === 'fetching' ? 'Sending...' : 'Send reset code'}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                <Link href="/sign-in">Back to sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        )}

        {/* Step 2: Code */}
        {codeSent && signIn.status !== 'needs_new_password' && (
          <form onSubmit={verifyCode}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="code">Reset code</FieldLabel>
                <InputGroup className="w-full bg-white">
                  <InputGroupInput
                    id="code"
                    type="text"
                    autoComplete="one-time-code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </InputGroup>
                {errors?.fields?.code && (
                  <p className="text-sm text-destructive">{errors.fields.code.message}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={fetchStatus === 'fetching'}>
                  {fetchStatus === 'fetching' ? 'Verifying...' : 'Verify code'}
                </Button>
              </Field>
              <FieldDescription className="text-center">
                <button
                  type="button"
                  onClick={() => setCodeSent(false)}
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  Use a different email
                </button>
              </FieldDescription>
            </FieldGroup>
          </form>
        )}

        {/* Step 3: New password */}
        {signIn.status === 'needs_new_password' && (
          <form onSubmit={submitNewPassword}>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="password">New password</FieldLabel>
                <InputGroup className="w-full bg-white">
                  <InputGroupInput
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <InputGroupAddon align="inline-end">
                    <Button
                      type="button"
                      variant="ghost"
                      className="border bg-transparent hover:bg-transparent h-8 w-6 size-4"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                  </InputGroupAddon>
                </InputGroup>
                {errors?.fields?.password && (
                  <p className="text-sm text-destructive">{errors.fields.password.message}</p>
                )}
              </Field>
              <Field>
                <Button type="submit" disabled={fetchStatus === 'fetching'}>
                  {fetchStatus === 'fetching' ? 'Saving...' : 'Set new password'}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        )}

        {/* 2FA fallback — extend if you have MFA enabled */}
        {signIn.status === 'needs_second_factor' && (
          <p className="text-sm text-muted-foreground">
            Two-factor authentication is required to finish resetting your password.
          </p>
        )}
      </CardContent>
    </Card>
  )
}