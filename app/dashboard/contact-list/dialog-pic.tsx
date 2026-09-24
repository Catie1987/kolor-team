"use client"
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, X } from "lucide-react";
import { createPic, updatePic, type Pic } from "@/lib/actions/pics";
import { picSchema } from "@/lib/schemas/pic";
import { Toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface DialogPicProps {
    contactId: string;
    contactName: string;
    pic?: Pic; // if provided, dialog operates in edit mode
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
}

const emptyForm = {
    title: "",
    fullName: "",
    department: "",
    position: "",
    mobileNumbers: [""],
    email: "",
};

function picToForm(pic: Pic) {
    return {
        title: pic.title ?? "",
        fullName: pic.fullName,
        department: pic.department ?? "",
        position: pic.position ?? "",
        mobileNumbers: pic.mobileNumbers.length > 0 ? pic.mobileNumbers : [""],
        email: pic.email ?? "",
    };
}

export function DialogPic({ contactId, contactName, pic, open, onOpenChange, onSaved }: DialogPicProps) {
    const isEditMode = !!pic;
    const [form, setForm] = useState(pic ? picToForm(pic) : emptyForm);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            setForm(pic ? picToForm(pic) : emptyForm);
            setErrors({});
        }
    }, [open, pic]);

    const updateField = (field: keyof typeof emptyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const updateMobileNumber = (index: number, value: string) => {
        setForm((prev) => ({
            ...prev,
            mobileNumbers: prev.mobileNumbers.map((n, i) => (i === index ? value : n)),
        }));
        setErrors((prev) => ({ ...prev, mobileNumbers: "" }));
    };

    const addMobileNumber = () => {
        setForm((prev) => ({ ...prev, mobileNumbers: [...prev.mobileNumbers, ""] }));
    };

    const removeMobileNumber = (index: number) => {
        setForm((prev) => ({
            ...prev,
            mobileNumbers: prev.mobileNumbers.filter((_, i) => i !== index),
        }));
    };

    const handleSave = async () => {
        const cleanedNumbers = form.mobileNumbers.map((n) => n.trim()).filter(Boolean);

        const parsed = picSchema.safeParse({
            contactId,
            title: form.title.trim() || undefined,
            fullName: form.fullName.trim(),
            department: form.department.trim() || undefined,
            position: form.position.trim() || undefined,
            mobileNumbers: cleanedNumbers,
            email: form.email.trim() || undefined,
        });

        if (!parsed.success) {
            const fieldErrors: Record<string, string> = {};
            for (const issue of parsed.error.issues) {
                const key = issue.path[0] as string;
                if (!fieldErrors[key]) fieldErrors[key] = issue.message;
            }
            setErrors(fieldErrors);
            return;
        }

        setSaving(true);
        try {
            if (isEditMode) {
                await updatePic(pic.id, parsed.data);
            } else {
                await createPic(parsed.data);
            }
            onOpenChange(false);
            onSaved();
            // toast.success(`PIC ${isEditMode ? "updated" : "added"}.`);
        } catch (err) {
            // toast.error(err instanceof Error ? err.message : "Could not save PIC.");
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-base">{isEditMode ? "Edit" : "Add"} Person In Charge</DialogTitle>
                    <DialogDescription>{contactName}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(e) => updateField("title", e.target.value)}
                                placeholder="e.g. Mr., Ms."
                            />
                        </div>
                        <div className="grid gap-2 col-span-2">
                            <Label htmlFor="fullName">Full Name*</Label>
                            <Input
                                id="fullName"
                                value={form.fullName}
                                onChange={(e) => updateField("fullName", e.target.value)}
                                placeholder="Nguyen Van A"
                                className={cn(errors.fullName && "border-destructive")}
                            />
                            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName}</p>}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="department">Department</Label>
                            <Input
                                id="department"
                                value={form.department}
                                onChange={(e) => updateField("department", e.target.value)}
                                placeholder="e.g. Purchase"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="position">Position</Label>
                            <Input
                                id="position"
                                value={form.position}
                                onChange={(e) => updateField("position", e.target.value)}
                                placeholder="e.g. Manager"
                            />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label>Mobile Numbers</Label>
                        <div className="flex flex-col gap-2">
                            {form.mobileNumbers.map((num, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input
                                        type="tel"
                                        value={num}
                                        onChange={(e) => updateMobileNumber(i, e.target.value)}
                                        placeholder="+84 555 555 5555"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeMobileNumber(i)}
                                        disabled={form.mobileNumbers.length === 1}
                                        className="shrink-0 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {errors.mobileNumbers && <p className="text-xs text-destructive">{errors.mobileNumbers}</p>}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addMobileNumber}
                            className="w-fit"
                        >
                            <Plus className="size-4" />
                            Add number
                        </Button>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email*</Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            onChange={(e) => updateField("email", e.target.value)}
                            placeholder="name@company.com"
                            className={cn(errors.email && "border-destructive")}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button onClick={handleSave} disabled={saving || !form.fullName.trim() || !form.email.trim()}>
                        {saving ? <><Loader2 className="animate-spin"/>Saving...</> : isEditMode ? "Save changes" : "Confirm"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}