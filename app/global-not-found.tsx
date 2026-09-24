import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react';
 
const inter = Inter({ subsets: ['latin'] })
 
export const metadata: Metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
}
 
export default function GlobalNotFound() {
  return (
    <html lang="en" className={inter.className}>
      <body>
        <div className='w-full h-dvh flex flex-col items-center justify-center bg-muted'>
            <h1 className='text-[100px]'>404</h1>
            <h2 className='text-[40px] text-muted-foreground'>Oops, This Page Not Found!</h2>
            <p>The link might be corrupted or this page does not exist.</p>
            <a 
            href="/" 
            className='flex gap-2 items-center justify-center text-white bg-primary px-4 py-2 rounded-lg hover:bg-primary/90 mt-4'
            >
                <ArrowLeft size={18}/>
                <p>Go back home</p>
            </a>
        </div>
      </body>
    </html>
  )
}