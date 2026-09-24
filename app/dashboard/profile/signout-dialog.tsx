"use client"

import { useClerk } from '@clerk/nextjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function SignOutDialog({ isOpen, setIsOpen }: DialogProps) {
    const { signOut } = useClerk();
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className='text-base'>Are you absolutely sure?</DialogTitle>
                    <DialogDescription>
                        This action cannot be undone. This will permanently direct you to homepage and need to sign in again to view dashboard.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button 
                        onClick={()=>setIsOpen(false)}
                        variant="outline"
                        className='rounded-lg'
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={() => signOut({ redirectUrl: '/' })}
                        className='rounded-lg'
                    >
                        Continue
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}