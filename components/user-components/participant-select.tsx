// components/participant-select.tsx
"use client"
import { useRef } from "react";
import {
  Combobox,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
} from "@/components/ui/combobox";
import { X } from "lucide-react";
import type { TeamMember } from "@/lib/actions/users";
import { GroupAvatar } from "./group-avatar";
import { UserAvatar } from "./user-avatar";
import { Button } from "../ui/button";

interface ParticipantSelectProps {
    members: TeamMember[]; // already excludes current user + leader, filtered by parent
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    onClear: () => void;
}

export function ParticipantSelect({ members, selectedIds, onChange, onClear }: ParticipantSelectProps) {
    const anchor = useRef<HTMLDivElement>(null);
    const selectedMembers = members.filter((m) => selectedIds.includes(m.id));
    return (
        <Combobox
            multiple
            items={members}
            itemToStringLabel={(item: TeamMember) => item.fullName}
            value={selectedMembers}
            onValueChange={(items: TeamMember[]) => onChange(items.map((i) => i.id))}
        >
            <ComboboxChips ref={anchor} className="border border-foreground/70 border-dashed rounded-lg h-10 w-auto p-2 flex-1 hover:bg-muted focus-within:border-primary">
                
                <ComboboxValue>
                    {(values: TeamMember[]) => (
                        <>
                            {values.length > 0 && (
                                <GroupAvatar users={values} max={4} size="sm" />
                            )}
                            <ComboboxChipsInput
                                placeholder={values.length === 0 ? "Select members..." :""}
                                className="flex-1 select-none cursor-default"
                                readOnly
                            />
                        </>
                    )}
                </ComboboxValue>
                
            </ComboboxChips>
            <Button 
                size="icon-lg" 
                variant="ghost" 
                className='absolute rounded-md right-7 aspect-square flex items-center justify-center'
                onClick={onClear}
            >
                <X className="size-4"/>
            </Button>
            <ComboboxContent anchor={anchor}>
                <ComboboxEmpty>No members found.</ComboboxEmpty>
                <ComboboxList>
                    {(item: TeamMember) => (
                        <ComboboxItem key={item.id} value={item}>
                            <UserAvatar user={item} size="md" className="mr-2" showName={true} showEmail={true} />
                        </ComboboxItem>
                    )}
                </ComboboxList>
            </ComboboxContent>
        </Combobox>
    )
}