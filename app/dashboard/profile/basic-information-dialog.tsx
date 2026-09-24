"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"


interface DialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

type CustomFields = {
  dateOfBirth?: string;
  personalPhone?: string;
  bio?: string;
};

export function BasicInformationDialog({ isOpen, setIsOpen }: DialogProps) {
  const { user } = useUser();
  const customFields = (user?.unsafeMetadata as CustomFields) ?? {}

  const [firstName, setFirstName] = useState(user?.firstName ?? "")
  const [lastName, setLastName] = useState(user?.lastName ?? "")
  const [dateOfBirth, setDateOfBirth] = useState(customFields.dateOfBirth ?? "")
  const [personalPhone, setPersonalPhone] = useState(customFields.personalPhone ?? "")
  const [bio, setBio] = useState(customFields.bio ?? "")

  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [error, setError] = useState<string | null>(null)

  if (!user) return null;

  const handleSave = async () => {
    setStatus("saving")
    setError(null)
    try {
      await user.update({
        firstName,
        lastName,
        unsafeMetadata: {
          ...user.unsafeMetadata,
          dateOfBirth,
          personalPhone,
          bio,
        },
      })

      setIsOpen(false)
      setStatus("idle")
    } catch (err) {
      console.error(err)
      setError("Could not save changes. Please try again.")
      setStatus("error")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className='px-0 pb-0 overflow-hidden'>
        <DialogHeader className='px-6'>
          <DialogTitle className='text-base'>Edit basic information</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 px-6 mb-4">
          <div className="grid grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className='focus-visible:ring-1'
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className='focus-visible:ring-1'
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className='focus-visible:ring-1'
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+84 555 555 5555"
                  value={personalPhone}
                  onChange={(e) => setPersonalPhone(e.target.value)}
                  className='focus-visible:ring-1'
                />
              </div>

              <div className="flex flex-col gap-2 col-span-2">
                <Label htmlFor="phone">Bio & Hobbies</Label>
                <Textarea
                  id="phone"
                  placeholder="tell us more about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className='focus-visible:ring-1'
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
        </div>
        <DialogFooter className='bg-muted px-6 py-3 border-t'>
          <Button className='rounded-lg' variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button className='rounded-lg' onClick={handleSave} disabled={status === "saving"}>
            {status === "saving" ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}