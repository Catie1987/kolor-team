"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface DialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function ChangePasswordDialog({ isOpen, setIsOpen }: DialogProps) {
  const { user } = useUser()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError(null)
    setStatus("idle")
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) reset()
    setIsOpen(open)
  }

  const handleSave = async () => {
    if (!user) return

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.")
      return
    }
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.")
      return
    }

    setStatus("saving")
    setError(null)
    try {
      await user.updatePassword({ currentPassword, newPassword })
      reset()
      setIsOpen(false)
    } catch (err) {
      console.error(err)
      setError("Could not update password. Check your current password and try again.")
      setStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className='px-0 pb-0 overflow-hidden'>
        <DialogHeader className='px-6'>
          <DialogTitle className='text-base'>Change password</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 px-6">
          <div className="grid gap-2">
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="focus-visible:ring-1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="focus-visible:ring-1"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="focus-visible:ring-1"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className='bg-muted px-6 py-3 border-t'>
          <Button variant="outline" onClick={() => handleOpenChange(false)} className='rounded-lg'>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={status === "saving" || !currentPassword || !newPassword || !confirmPassword}
            className='rounded-lg'
          >
            {status === "saving" ? "Updating..." : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}