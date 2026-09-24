'use client'

import { useWaitlist } from '@clerk/nextjs';
import {Button} from '@/components/ui/button';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Mail} from 'lucide-react';
import { LoaderIcon, Check } from "lucide-react"
import logo from "@/assets/logo/logo-small.png";
import Image from 'next/image';
import Link from "next/link";
import GridLayout from '@/components/grid-layout'


export default function Page() {
  const { waitlist, errors, fetchStatus } = useWaitlist()

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const emailAddress = formData.get('emailAddress') as string

    const { error } = await waitlist.join({ emailAddress })
    if (error) {
      console.error('Failed to join waitlist:', error)
    }
  }

  return (
    <GridLayout>
        <div className='flex flex-col gap-10 h-full w-full justify-center items-center px-4 pb-10'>
            <Image alt='logo' src={logo} width='200' height='100'/>
            {waitlist.id ? (
              <div className='flex flex-col gap-2 max-w-md border p-4 rounded-xl bg-white shadow-sm'>
                <div className='flex items-center gap-2'>
                  <div className='rounded-full bg-emerald-500 p-1'>
                    <Check className='size-5 text-white'/>
                  </div>
                  <h1 className='text-base sm:text-lg font-semibold'>
                    Submitted successful!
                  </h1>
                </div>
                <p className='text-muted-foreground pl-10 text-sm sm:text-base'>
                  We have recieved your request to join Kisco Dashboard. We'll notify you when you're approved.
                </p>
              </div>
            ): (
              <div className='flex flex-col gap-6 items-center justify-center'>
                <h1 className='text-[24px] sm:text-[32px] font-semibold'>
                    Request to view Dashboard
                </h1>
                <form onSubmit={handleSubmit} className='max-w-sm w-full'>
                  <InputGroup className="max-w-sm w-full h-10 rounded-full bg-white">
                    <label htmlFor="email" className='hidden'>Email address</label>
                    <InputGroupInput 
                      placeholder="Leave your email..." 
                      name="emailAddress"
                      type="email" 
                      required
                    />
                    <InputGroupAddon>
                      <Mail />
                    </InputGroupAddon>
                    <InputGroupAddon align="inline-end">
                      <Button className='min-w-24 rounded-full translate-x-0.5' type="submit" disabled={fetchStatus === 'fetching'}>
                        {fetchStatus === 'fetching' ? ( <><LoaderIcon className="animate-spin" />Submitting</>): 'Submit'}
                      </Button>
                    </InputGroupAddon>
                  </InputGroup>
                </form>
                {errors.fields.emailAddress && <p>{errors.fields.emailAddress.longMessage}</p>}
              </div>
            )}
          <div className='mb-6 text-muted-foreground flex items-center gap-2'>
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