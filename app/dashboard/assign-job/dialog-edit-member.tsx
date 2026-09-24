// components/dialog-edit-member.tsx
"use client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,
} from "@/components/ui/select"
import { updateMemberInfo, type UserMember } from "@/lib/actions/users"
import { toast } from "@/components/ui/toast"
import { employmentTypeOptions, timeOptions } from "@/lib/helper"

interface DialogEditMemberProps {
    member: UserMember | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (member: UserMember) => void;
}



export function DialogEditMember({ member, open, onOpenChange, onSaved }: DialogEditMemberProps) {
    const [position, setPosition] = useState("");
    const [workingHour, setWorkingHour] = useState("");
    const [employmentType, setEmploymentType] = useState("");
    const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [startTime, setStartTime] = useState("--:--");
    const [endTime, setEndTime] = useState("--:--");

    useEffect(() => {
        if (open && member) {
            setPosition(member.position);
            setEmploymentType(member.employmentType);
            setError(null);

            // Parse existing "08:00 - 17:30" into start/end, if present
            const parts = member.workingHour?.split(" - ");
            if (parts?.length === 2) {
                setStartTime(parts[0]);
                setEndTime(parts[1]);
            } else {
                setStartTime("--:--");
                setEndTime("--:--");
            }
        }
    }, [open, member]);

    if (!member) return null;

    const handleSave = async () => {
    setStatus("saving");
    setError(null);

    try {
        const updatedMember = await updateMemberInfo({
            userId: member.id,
            position,
            workingHour: `${startTime} - ${endTime}`,
            employmentType,
        });

        onSaved?.(updatedMember as UserMember);

        onOpenChange(false);

        setStatus("idle");

        toast.add({
            type: "success",
            title: "Saved",
            description: `${member.fullName}'s info updated.`,
        });
    } catch (err) {
        console.error(err);
        setError(
            err instanceof Error
                ? err.message
                : "Could not save changes. Please try again."
        );
        setStatus("error");
    }
};

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className='px-0 pb-0 overflow-hidden'>
                <DialogHeader className='px-6'>
                    <DialogTitle className='text-lg'>Edit member — {member.fullName}</DialogTitle>
                    <div className="flex flex-col text-muted-foreground">
                        <span className="text-muted-foreground">Email: {member.email}</span>
                        <span>You can change information of this member, click save when you're done</span>
                    </div>
                </DialogHeader>
                <div className="space-y-6 px-6 mb-4">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="grid gap-4">
                            <Label>Employment type</Label>
                            <Select value={employmentType} onValueChange={(v) => v && setEmploymentType(v)}>
                                <SelectTrigger className="w-full">
                                    {employmentTypeOptions.find((o) => o.value === employmentType)?.label ?? "Select type"}
                                </SelectTrigger>
                                <SelectContent alignItemWithTrigger={false}>
                                    <SelectGroup>
                                        {employmentTypeOptions.map((o) => (
                                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-4">
                            <Label>Working hour</Label>
                            <div className="grid gap-2 grid-cols-2">
                                <div className="relative w-full">
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs px-2 bg-card text-muted-foreground">
                                        From
                                    </span>
                                    <Select value={startTime} onValueChange={(v) => v && setStartTime(v)}>
                                        <SelectTrigger className="w-full text-center justify-center [&>svg]:hidden hover:border-primary/20 hover:ring-1 hover:ring-primary/80">
                                            {startTime}
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            <SelectGroup>
                                                {timeOptions.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="relative w-full">
                                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xs px-2 bg-card">
                                        To
                                    </span>
                                    <Select value={endTime} onValueChange={(v) => v && setEndTime(v)}>
                                        <SelectTrigger className="w-full text-center justify-center [&>svg]:hidden hover:border-primary/20 hover:ring-1 hover:ring-primary/80">
                                            {endTime}
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            <SelectGroup>
                                                {timeOptions.map((t) => (
                                                    <SelectItem key={t} value={t}>{t}</SelectItem>
                                                ))}
                                            </SelectGroup>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>               
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="position">Position</Label>
                        <Input
                            id="position"
                            placeholder="e.g. Sales Manager"
                            value={position}
                            onChange={(e) => setPosition(e.target.value)}
                            className='focus-visible:ring-1'
                        />
                        {error && <p className="text-sm text-destructive">{error}</p>}
                    </div>
                    
                </div>
                <DialogFooter className='bg-muted px-6 py-3 border-t'>
                    <Button className='rounded-lg' variant="outline" onClick={() => onOpenChange(false)}>
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