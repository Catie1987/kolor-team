"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"

interface DialogProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

type CustomFields = {
  workAt?: string;
  branch?: string;
  department?: string;
};

export function WorkDialog({ isOpen, setIsOpen }: DialogProps) {
    const { user } = useUser();
    const customFields = (user?.unsafeMetadata as CustomFields) ?? {}

    const [workAt, setWorkAt] = useState(customFields.workAt ?? "")
    const [branch, setBranch] = useState(customFields.branch ?? "")
    const [department, setDepartment] = useState(customFields.department ?? "")
    const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
    const [error, setError] = useState<string | null>(null)

    if (!user) return null;

    const handleSave = async () => {
        setStatus("saving")
        setError(null)
        try {
    
        await user.update({
            unsafeMetadata: { ...user.unsafeMetadata, workAt, branch, department },
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
                    <DialogTitle className='text-base'>Edit work information</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 px-6">
                    <div className="grid gap-2">
                        <Label htmlFor="workAt">Work at</Label>
                        <Input
                            id="workAt"
                            placeholder="ABC Co.,Ltd"
                            value={workAt}
                            onChange={(e) => setWorkAt(e.target.value)}
                            className='focus-visible:ring-1' 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="workAt">Branch</Label>
                        <Input
                            id="branch"
                            value={branch}
                            placeholder="HCM city"
                            onChange={(e) => setBranch(e.target.value)}
                            className='focus-visible:ring-1' 
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="workAt">Department</Label>
                        <Input
                            id="department"
                            value={department}
                            placeholder="Marketing Dept"
                            onChange={(e) => setDepartment(e.target.value)}
                            className='focus-visible:ring-1' 
                        />
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