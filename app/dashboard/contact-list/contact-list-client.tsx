"use client"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Search } from "lucide-react"
import { AddCustomerDialog } from "./dialog-add-customer";
import { useState } from "react";
import { Contact, ContactType } from "@/lib/actions/contacts";
import { ContentList } from "./content-list";
import { ContactDetail } from "./contact-detail";
import { PicList } from "./pic-list";

const types = [
  { label: "Customers", value: "customers" },
  { label: "Suppliers", value: "suppliers" },
  { label: "Forwarders", value: "forwarders" },
]

export function ContactListClient() {
    const [type, setType] = useState<ContactType>("customers");
    const [search, setSearch] = useState("");
    const [refreshKey, setRefreshKey] = useState(0);
    const [resultCount, setResultCount] = useState(0);
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
    const selectedLabel = types.find((t) => t.value === type)?.label;
    
    const handleDataChanged = (updatedContact?: Contact) => {
        setRefreshKey((k) => k + 1);
        if (updatedContact) {
            setSelectedContact(updatedContact); // detail panel shows fresh data immediately
        } else {
            setSelectedContact(null); // deleted — clear selection
        }
    };

    return (
        <div className="@container/main w-full py-2 gap-4 md:py-4 px-2 lg:px-4">
            <div className="w-full grid grid-cols-1 gap-4 @2xl/main:grid-cols-2 @4xl/main:grid-cols-3">
                <div className="flex flex-col gap-2 h-fit">
                    <div className="w-full flex items-center gap-2">
                        <Select items={types} onValueChange={(v) => v && setType(v as ContactType)}>
                            <SelectTrigger className="bg-card rounded-lg shadow-sm flex-1">
                                {selectedLabel}
                            </SelectTrigger>
                            <SelectContent alignItemWithTrigger={false} align={"start"}>
                                <SelectGroup>
                                {types.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                    </SelectItem>
                                ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                        <AddCustomerDialog
                            type={type}
                            onSaved={() => setRefreshKey((k) => k + 1)}
                        />
                    </div>
                    <div className="border rounded-lg shadow-sm min-h-96 h-[78dvh] w-full bg-card relative overflow-hidden">
                        <div className="h-12">
                            <div className="bg-card p-2">
                                <InputGroup className="w-full">
                                    <InputGroupInput 
                                        placeholder="Search customer..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)} 
                                    />
                                    <InputGroupAddon>
                                        <Search />
                                    </InputGroupAddon>
                                    <InputGroupAddon align="inline-end">
                                        {resultCount} {resultCount === 1 ? "result" : "results"}
                                    </InputGroupAddon>
                                </InputGroup>
                            </div>
                        </div>
                        <ContentList
                            type={type}
                            search={search}
                            refreshKey={refreshKey}
                            onSelectContact={setSelectedContact}
                            selectedContactId={selectedContact?.id}
                            onResultCountChange={setResultCount}
                        />
                    </div>
                </div>
                <div className="w-full h-full min-h-20 flex flex-col @2xl/main:col-span-1 @4xl/main:col-span-2 gap-4">
                    <ContactDetail
                        contact={selectedContact}
                        type={type}
                        onDataChanged={handleDataChanged}
                    />
                    <PicList
                        contactId={selectedContact?.id ?? ""}
                        contactName={selectedContact?.name ?? ""}
                        refreshKey={refreshKey}
                        onEdit={(pic) => console.log("Edit pic", pic)}
                    />
                </div>
            </div>
        </div>
    )
}