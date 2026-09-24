"use client"
import { useState, useEffect, useMemo } from "react";
import { getContacts, type Contact, type ContactType } from "@/lib/actions/contacts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HighlightText } from "@/components/highlight-text";
import { cn } from "@/lib/utils";

interface ContentListProps {
    type: ContactType;
    search: string;
    refreshKey: number;
    onSelectContact: (contact: Contact) => void;
    selectedContactId?: string;
    onResultCountChange?: (count: number) => void;
}

export function ContentList({ type, search, refreshKey, onSelectContact, selectedContactId, onResultCountChange}: ContentListProps) {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        getContacts(type)
            .then((data) => {
                const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
                setContacts(sorted);
            })
            .finally(() => setLoading(false));
    }, [type, refreshKey]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return contacts;
        return contacts.filter((c) =>
            [c.name, c.shortName]
                .filter(Boolean)
                .some((field) => field!.toLowerCase().includes(q))
        );
    }, [contacts, search]);

    useEffect(() => {
        onResultCountChange?.(filtered.length);
    }, [filtered.length, onResultCountChange]);

    if (loading) {
        return <p className="text-sm text-muted-foreground p-4 text-center">Loading...</p>;
    }

    if (filtered.length === 0) {
        return <p className="text-sm text-muted-foreground p-4 text-center">No results found.</p>;
    }
    
    return (
        <div className="h-full w-full"
        style={{
            WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
            maskImage:
            "linear-gradient(to bottom, transparent 0px, black 24px, black calc(100% - 24px), transparent 100%)",
        }}
        >
            <ScrollArea className="w-full h-[70dvh] min-h-84 px-2">
                <ul className="flex flex-col divide-y">
                    {filtered.map((contact) => {
                        const isSelected = contact.id === selectedContactId;
                        return (
                            <li key={contact.id}
                                onClick={() => onSelectContact(contact)}
                                className={cn("flex items-center gap-3 px-2 py-3 select-none group")}
                            >
                                <p className={cn("text-sm min-w-12 text-muted-foreground", 
                                    isSelected && "text-primary")}>
                                    <HighlightText text={contact.shortName} query={search} />
                                </p>
                                <p className={cn("text-sm font-medium truncate underline-offset-2", 
                                    isSelected ? "text-primary font-medium underline" : "font-normal",
                                    "group-hover:underline"
                                    )}>
                                    <HighlightText text={contact.name} query={search} />
                                </p>
                            </li>
                        )
                    })}
                </ul>
            </ScrollArea>
        </div>
    )
}