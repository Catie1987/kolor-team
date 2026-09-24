"use client";
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { BusinessType, Contact, ContactInput, ContactType, createContact, updateContact } from "@/lib/actions/contacts";
import { generateShortName } from "@/lib/helper";
import { Loader2, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface AddCustomerDialogProps {
    type: ContactType;
    contact?: Contact;
    onSaved?: (savedContact: Contact) => void;
    trigger?: React.ReactNode; 
}

const typeLabels: Record<ContactType, string> = {
    customers: "Customer",
    suppliers: "Supplier",
    forwarders: "Forwarder",
};

const emptyForm = {
    name: "",
    shortName: "",
    taxId: "",
    businessType: "" as BusinessType | "",
    region: "",
    provinceCity: "",
    industrialZone: "",
    fullAddress: "",
    phoneNumber: "",
    information: "",
};

function contactToForm(contact: Contact) {
    return {
        name: contact.name,
        shortName: contact.shortName,
        taxId: contact.taxId ?? "",
        businessType: contact.businessType ?? "",
        region: contact.region ?? "",
        provinceCity: contact.provinceCity ?? "",
        industrialZone: contact.industrialZone ?? "",
        fullAddress: contact.fullAddress ?? "",
        phoneNumber: contact.phoneNumber ?? "",
        information: contact.information ?? "",
    };
}

export function AddCustomerDialog({
    type, contact, onSaved, trigger
}: AddCustomerDialogProps) {
    const isEditMode = !!contact;
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState(contact ? contactToForm(contact) : emptyForm);
    const [shortNameTouched, setShortNameTouched] = useState(isEditMode); // in edit mode, never auto-overwrite
    const [nameError, setNameError] = useState<string | null>(null);
    const [shortNameError, setShortNameError] = useState<string | null>(null);

    useEffect(() => {
        if (contact) {
            setForm(contactToForm(contact));
            setShortNameTouched(true);
        }
    }, [contact]);

    const updateField = (field: keyof typeof emptyForm, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };
    const handleNameChange = (value: string) => {
        setForm((prev) => ({
            ...prev,
            name: value,
            // Only auto-fill short name if the user hasn't manually edited it
            shortName: shortNameTouched ? prev.shortName : generateShortName(value),
        }));
        setShortNameError(null);
    };
    const handleShortNameChange = (value: string) => {
        setShortNameTouched(true);
        setShortNameError(null); 
        updateField("shortName", value.toUpperCase());
    };
    const handleSave = async () => {
        let hasError = false;
        if (!form.name.trim()) {
            setNameError("*(Name is required)");
            hasError = true;
        }
        if (!form.shortName.trim()) {
            setShortNameError("Short name is required.");
            hasError = true;
        }
        if (hasError) return;

        setSaving(true);
        try {
            let saved: Contact;
            if (isEditMode) {
                saved = await updateContact(contact.id, {
                    ...form,
                    businessType: form.businessType === "" ? undefined : (form.businessType as BusinessType),
                });
            } else {
                const input: ContactInput = {
                    type,
                    ...form,
                    businessType: form.businessType === "" ? undefined : (form.businessType as BusinessType),
                };
                saved = await createContact(input);
            }
            setOpen(false);
            if (!isEditMode) {
                setForm(emptyForm);
                setShortNameTouched(false);
            }
            onSaved?.(saved); // pass the fresh data up
            toast.add({
                type: "success",
                title: "Success",
                description: `${typeLabels[type]} has been ${isEditMode ? "updated" : "added"}.`,
            });
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong.";
            if (message.toLowerCase().includes("short name")) {
                setShortNameError("Short name already exists.");
            } else {
                setShortNameError("Short name already exists.");
            }
        } finally {
            setSaving(false);
        }
    };
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <span onClick={() => setOpen(true)}>{trigger}</span>
            ) : (
            <DialogTrigger render={
                <Button className="h-9" onClick={() => setOpen(true)}>
                    <Plus/>
                    Add New
                </Button>
            }/>)}
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="capitalize text-base">{isEditMode ? "Edit" : "Add New"} {typeLabels[type]}</DialogTitle>
                    <DialogDescription>
                        Please ensure that not duplicated name and fill in much information as possible.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 p-2 -ml-4 -mr-6 no-scrollbar max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-3 gap-2">
                        <div className="grid gap-2 col-span-2">
                            <div className="flex items-center gap-1.5">
                                <Label htmlFor="name">{typeLabels[type]}*</Label>
                                <span className="text-xs text-destructive">{nameError}</span>
                            </div>
                            <Input
                                id="name"
                                value={form.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder={`${typeLabels[type]} or company name`}
                            />
                        </div>
                        {type === "customers" && (
                            <div className="grid gap-2">
                                <Label htmlFor="businessType">Type</Label>
                                <Select
                                    value={form.businessType}
                                    onValueChange={(v) => v && updateField("businessType", v)}
                                >
                                    <SelectTrigger id="businessType" className="w-full">
                                        {form.businessType === "epe" ? "EPE" : form.businessType === "non-epe" ? "Non-EPE" : "Select"}
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="epe">EPE</SelectItem>
                                            <SelectItem value="non-epe">Non-EPE</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                            {shortNameError ? (
                                <p className="col-span-4 text-xs text-destructive">{shortNameError}</p>
                            ): (
                                <span className="col-span-4 text-muted-foreground text-xs">Short name will be auto generate, can be edit but cannot be duplicate</span>
                            )}  
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shortName">Short Name*</Label>
                            <Input
                                id="shortName"
                                value={form.shortName}
                                onChange={(e) => handleShortNameChange(e.target.value)}
                                placeholder="ABC"
                                className="uppercase"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="taxId">Tax ID</Label>
                            <Input
                                id="taxId"
                                value={form.taxId}
                                onChange={(e) => updateField("taxId", e.target.value)}
                                placeholder="e.g. 0123456789"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="region">Region</Label>
                            <Input
                                id="region"
                                value={form.region}
                                onChange={(e) => updateField("region", e.target.value)}
                                placeholder="e.g. North"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="provinceCity">Province/City</Label>
                            <Input
                                id="provinceCity"
                                value={form.provinceCity}
                                onChange={(e) => updateField("provinceCity", e.target.value)}
                                placeholder="e.g. Da Nang"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="industrialZone">Industrial Zone</Label>
                            <Input
                                id="industrialZone"
                                value={form.industrialZone}
                                onChange={(e) => updateField("industrialZone", e.target.value)}
                                placeholder="e.g. Hoa Khanh IZ"
                            />
                        </div>
                        <div className="grid gap-2">
                        <Label htmlFor="phoneNumber">Phone number</Label>
                        <Input
                            id="phoneNumber"
                            type="tel"
                            value={form.phoneNumber}
                            onChange={(e) => updateField("phoneNumber", e.target.value)}
                            placeholder="+84 555 555 5555"
                        />
                    </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="fullAddress">Full Address</Label>
                        <Input
                            id="fullAddress"
                            value={form.fullAddress}
                            onChange={(e) => updateField("fullAddress", e.target.value)}
                            placeholder="Street, ward, district..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="information">Information</Label>
                        <Textarea
                            id="information"
                            value={form.information}
                            onChange={(e) => updateField("information", e.target.value)}
                            placeholder="Production, Notes, Market area, etc."
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose render={<Button variant="outline">Cancel</Button>} />
                    <Button onClick={handleSave} disabled={saving || !form.name.trim() || !form.shortName.trim()}>
                        {saving ? <><Loader2 className="animate-spin"/>{isEditMode ?"Updating..." : "Saving..."}</> : isEditMode ? "Update Now" : "Save Now"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}