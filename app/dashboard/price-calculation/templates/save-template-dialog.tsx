// components/save-template-dialog.tsx
"use client"
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveCalculationTemplate, type CalculationTemplateData } from "@/lib/actions/calculation-templates";
import { Loader, TriangleAlert } from 'lucide-react';
import { toast } from "@/components/ui/toast";

interface SaveTemplateDialogProps {
    getData: () => CalculationTemplateData;
    onSaved?: () => void;
}

export function SaveTemplateDialog({ getData, onSaved }: SaveTemplateDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);
    const [limitDialogOpen, setLimitDialogOpen] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) return;
        setSaving(true);
        try {
            const result = await saveCalculationTemplate(name, description, getData());

            if (!result.success) {
                // Limit reached — close the save dialog, show the limit dialog instead
                setOpen(false);
                setLimitDialogOpen(true);
                return;
            }

            setOpen(false);
            setName("");
            setDescription("");
            onSaved?.();
            toast.add({
                type: "success",
                title: "Success",
                description: "Your template has been saved.",
            });
        } catch (err) {
            console.error(err);
            toast.add({
                type: "error",
                title: "Error",
                description: "Could not save your template. Please try again.",
            });
        } finally {
            setSaving(false);
        }
    };
    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <Button onClick={() => setOpen(true)}>
                Save Template
            </Button>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-lg">Save calculation template</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="templateName">Template name</Label>
                        <Input
                            id="templateName"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Air shipment from Japan - CIF"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="templateDescription">Description (optional)</Label>
                        <Textarea
                            id="templateDescription"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Notes for other team members"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button 
                    onClick={handleSave} 
                    disabled={saving || !name.trim()}>
                        {saving ? (<><Loader className="animate-spin"/>Saving...</>) : "Save now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        <Dialog open={limitDialogOpen} onOpenChange={setLimitDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <TriangleAlert className="size-5 text-orange-600" />
                        <DialogTitle className="text-lg">Template limit reached</DialogTitle>
                    </div>
                    <DialogDescription>
                        You've saved the maximum of 10 templates. Delete an existing template from
                        the "Load Template" list to make room for a new one.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose render={<Button className="w-full">Got it</Button>} />
                </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}