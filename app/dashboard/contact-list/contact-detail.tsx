"use client"

import { Contact, ContactType, deleteContact } from "@/lib/actions/contacts";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { AddCustomerDialog } from "./dialog-add-customer";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Phone, MapPin, Building2, Info, Map, MapPinned } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { UserHoverCard } from "@/components/user-components/user-hover-card";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getPicCount } from "@/lib/actions/pics";
import { toast } from "@/components/ui/toast";

interface ContactDetailProps {
    contact: Contact | null;
    type: ContactType;
    onDataChanged: (updatedContact?: Contact) => void;
}

export function ContactDetail({ contact, type, onDataChanged }: ContactDetailProps) {
    const { user } = useUser();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [picCount, setPicCount] = useState<number | null>(null);

    useEffect(() => {
        if (deleteDialogOpen && contact) {
            getPicCount(contact.id).then(setPicCount).catch(() => setPicCount(null));
        }
    }, [deleteDialogOpen, contact]);

    if (!contact) return (
        <div className="border rounded-lg shadow-sm min-h-40 bg-card flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center">Please select customer, supplier or forwarder in the list to view detail</p>
        </div>
    );
    
    const role = user?.publicMetadata?.role as string | undefined;
    const isAdmin = role === "admin";
    const isOwner = contact.users?.clerk_user_id === user?.id;
    const canDelete = isAdmin || isOwner;

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await deleteContact(contact.id); // cascades to pics via FK on delete cascade
            toast.add({
                type: "warning",
                title: "Deleted",
                description: "`${contact.name} and its data has been deleted.`",
            });
            setDeleteDialogOpen(false);
            onDataChanged(); // no updated contact — it's gone
        } catch (err) {
            toast.add({
                type: "error",
                title: "Error",
                description: "Could not delete contact. Please try again.",
            });
        } finally {
            setDeleting(false);
        }
    };
    return (
        <div className="@container/card border rounded-lg shadow-sm min-h-40 bg-card p-4 flex flex-col">
            <div className="flex items-start justify-between gap-2 mb-1">
                <div className="block">
                    <span className="text-sm bg-primary text-white rounded-sm py-1 px-2 mr-2">{contact.shortName}</span>{contact.name}
                </div>
                <div className="flex items-center gap-1 shrink-0 -mt-1">
                    <AddCustomerDialog
                        type={type}
                        contact={contact}
                        onSaved={(saved) => onDataChanged(saved)}
                        trigger={
                            <Button variant="ghost" size="icon" className="text-muted-foreground">
                                <Pencil className="size-4" />
                            </Button>
                        }
                    />
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-muted-foreground hover:text-destructive"
                        >
                            <Trash2 className="size-4" />
                        </Button>
                        )}
                </div>
            </div>
            <Separator/>
            <div className="flex items-center gap-1">
                <span className="text-xs italic text-muted-foreground">Created by</span>
                <UserHoverCard creator={contact.creator} dateValue={contact.created_at}/>
            </div>

            <div className="grid gap-3 @[400px]/card:grid-cols-2">
                <DetailRow icon={MapPin} label="Region" value={contact.region} />    
                <DetailRow icon={MapPinned} label="Province/City" value={contact.provinceCity} />
                <DetailRow icon={Building2} label="Industrial Zone" value={contact.industrialZone} /> 
                <DetailRow icon={Phone} label="Phone number" value={contact.phoneNumber} />
            </div>
            <div className="flex flex-col gap-3 mt-3">
                <DetailRow icon={Map} label="Full Address" value={contact.fullAddress} />
                <DetailRow icon={Info} label="Information" value={contact.information} multiline />       
            </div>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this contact detail?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete{" "}
                            <span className="font-medium text-foreground">{contact.name}</span>
                            {picCount !== null && picCount > 0 && (
                                <>
                                    {" "}and all{" "}
                                    <span className="font-medium text-foreground">
                                        {picCount} PIC{picCount > 1 ? "s" : ""}
                                    </span>{" "}
                                    associated with this contact
                                </>
                            )}
                            .
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

function DetailRow({
    icon: Icon,
    label,
    value,
    multiline,
}: {
    icon: React.ElementType;
    label: string;
    value?: string | null;
    multiline?: boolean;
}) {
    return (
        <div className="flex flex-col">
            <span className="text-xs text-muted-foreground flex items-center gap-2">
                <Icon className="size-4 text-foreground" />
                {label}
            </span>
            <p className={cn("ml-6 text-sm", multiline && "text-sm whitespace-pre-wrap")}>
                {value || <span className="text-muted-foreground/80">Not provided</span>}
            </p>
        </div>
    );
}