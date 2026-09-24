"use client"
import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createProject, updateProject, type Project } from "@/lib/actions/projects";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from "@/components/ui/combobox";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger,
} from "@/components/ui/select";
import {Contact, getContacts} from "@/lib/actions/contacts";
import { Textarea } from "@/components/ui/textarea";
import { getTeamMembers, TeamMember } from "@/lib/actions/users";
import { pricingModelEnum, priorityEnum, projectSchema, statusEnum } from "@/lib/schemas/project";
import { InputGroup, InputGroupAddon, InputGroupText } from "@/components/ui/input-group";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { UserAvatar } from "@/components/user-components/user-avatar";
import { ParticipantSelect } from "@/components/user-components/participant-select";
import { DatePickerField } from "@/components/date-picker-field";
import { Loader2 } from "lucide-react";
import { toast } from "@/components/ui/toast";

interface DialogProjectProps {
    // contactId: string;
    // contactName: string;
    project?: Project; // if provided, dialog operates in edit mode
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (project: Project) => void;
    currentUserId: string;
    currentUserName: string; // for display when non-admin
    isAdmin: boolean;
}

const pricingLabels: Record<string, string> = {
    monthly: "Monthly",
    yearly: "Yearly",
    one_time: "One-time",
};

const statusLabels: Record<string, string> = {
    just_started: "Just Started",
    in_progress: "In Progress",
    success: "Success",
    pending: "Pending",
    drop: "Drop",
};

const priorityLabels: Record<string, string> = {
    high: "High",
    medium: "Medium",
    low: "Low",
};

function emptyForm(currentUserId: string) {
    return {
        customerId: "",
        description: "",
        pricingModel: "monthly" as const,
        pricingValue: "",
        currency: "USD",
        status: "just_started" as const,
        priority: "medium" as const,
        leaderId: currentUserId,
        participantIds: [] as string[],
        startedAt: new Date().toISOString().slice(0, 10),
    };
}

function projectToForm(project: Project) {
    return {
        customerId: project.customerId ?? "",
        description: project.description ?? "",
        pricingModel: project.pricingModel,
        pricingValue: String(project.pricingValue),
        currency: project.currency,
        status: project.status,
        priority: project.priority,
        leaderId: project.leaderId,
        participantIds: project.participantIds ?? [],
        startedAt: project.startedAt ? project.startedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    };
}

export function DialogProject({ 
  project, 
  open, 
  onOpenChange, 
  currentUserId, 
  onSaved,
  currentUserName,
  isAdmin
}: DialogProjectProps) {
  const isEditMode = !!project;
  const [form, setForm] = useState(project ? projectToForm(project) : emptyForm(currentUserId));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);

  useEffect(() => {
        if (!open) return;

        setForm(project ? projectToForm(project) : emptyForm(currentUserId));
        setErrors({});

        if (contacts.length === 0) {
            getContacts("customers")
            .then((data) => {
                const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
                setContacts(sorted);
            })
            .catch(console.error);
        }
        if (members.length === 0) {
            getTeamMembers().then(setMembers).catch(console.error);
        }
    }, [open, project, currentUserId]);

  const updateField = <K extends keyof ReturnType<typeof emptyForm>>(
        field: K,
        value: ReturnType<typeof emptyForm>[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: "" }));
    };

    const selectedContact = contacts.find((c) => c.id === form.customerId);
    const leader = members.find((m) => m.id === form.leaderId);
    const emptyContact: Contact | null = null;

    const handleSave = async () => {
        const parsed = projectSchema.safeParse({
            customerId: form.customerId || undefined,
            description: form.description || undefined,
            pricingModel: form.pricingModel,
            pricingValue: Number(form.pricingValue) || 0,
            currency: form.currency,
            status: form.status,
            priority: form.priority,
            leaderId: form.leaderId,
            participantIds: form.participantIds,
            startedAt: form.startedAt ? new Date(form.startedAt).toISOString() : undefined,
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
            const saved = isEditMode
                ? await updateProject(project.id, parsed.data)
                : await createProject(parsed.data);
            onOpenChange(false);
            onSaved(saved);
            toast.add({
                type: "success",
                title: "Success",
                description: `Your project has been ${isEditMode ? "updated" : "created"}.`,
            });
        } catch (err) {
            toast.add({
                type: "error",
                title: "Error",
                description: `Could not ${isEditMode ? "update" : "create"} project, please try again.`,
            });
        } finally {
            setSaving(false);
        }
    };
  
  return(
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{isEditMode ? "Edit your Project" : "Create new Project"}</DialogTitle>
          <DialogDescription>When adding members to support on your project, you have to wait for reply confirm from your team.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Combobox
            items={contacts}
            itemToStringLabel={(item: Contact) => item.name}
            value={selectedContact ?? emptyContact}
            onValueChange={(item) => updateField("customerId", item?.id ?? "")}
          >
            <ComboboxInput placeholder="Select customer" showClear/>
            <ComboboxContent className="w-full max-w-full">
              <ComboboxEmpty>No customers found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: Contact) => (
                    <ComboboxItem key={item.id} value={item}>
                      <span className="font-mono text-xs mr-2 text-muted-foreground min-w-10">{item.shortName}</span>
                      <p className="truncate">{item.name}</p>
                    </ComboboxItem>
                  )}
                </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Items, Inquiries, or more details about the project..."
          />
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <Label htmlFor="pricingModel" className='col-span-2'>Project Value</Label>
          <div className="grid gap-2">
            <InputGroup className="">
              <InputGroupAddon>
                <InputGroupText>$</InputGroupText>
              </InputGroupAddon>
              <InputGroupAddon align="inline-end">
                <InputGroupText>USD</InputGroupText>
              </InputGroupAddon>
              <FormattedNumberInput
                asGroupInput
                id="pricingValue"
                placeholder="0.00"
                value={form.pricingValue}
                onChange={(value) => updateField("pricingValue", value)}
              />
            </InputGroup>
          </div>
          <div className="grid gap-2">
            <Select value={form.pricingModel} onValueChange={(v) => v && updateField("pricingModel", v as any)}>
              <SelectTrigger className="w-full">
                {pricingLabels[form.pricingModel]}
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {pricingModelEnum.options.map((opt) => (
                    <SelectItem key={opt} value={opt}>{pricingLabels[opt]}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => v && updateField("status", v as any)} disabled={!isEditMode}>
                <SelectTrigger className="w-full">
                    {statusLabels[form.status]}
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {statusEnum.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{statusLabels[opt]}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => v && updateField("priority", v as any)}>
                <SelectTrigger className="w-full">
                    {priorityLabels[form.priority]}
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {priorityEnum.options.map((opt) => (
                            <SelectItem key={opt} value={opt}>{priorityLabels[opt]}</SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div className="grid gap-2">
            <Label>Project Leader</Label>
            {isAdmin ? (
              <Select value={form.leaderId} onValueChange={(v) => v && updateField("leaderId", v)}>
                  <SelectTrigger className="w-full">
                      {leader ? leader.fullName : "Select leader"}
                  </SelectTrigger>
                  <SelectContent>
                      <SelectGroup>
                          {members.map((m) => (
                              <SelectItem key={m.id} value={m.id}>
                                  <div className="flex items-center gap-2">
                                    <UserAvatar user={m} size="sm" showName={false} showEmail={false} />
                                      {m.fullName}
                                  </div>
                              </SelectItem>
                          ))}
                      </SelectGroup>
                  </SelectContent>
              </Select>
            ):(
              <div className="w-full h-8 border rounded-md p-2 flex items-center gap-2 select-none pl-3">
                  {currentUserName}
              </div>
            )}
            {errors.leaderId && <p className="text-xs text-destructive">{errors.leaderId}</p>}
          </div>
          <div className="grid gap-2">
              <Label>Start Date</Label>
              <DatePickerField
                  value={form.startedAt}
                  onChange={(isoDate) => updateField("startedAt", isoDate)}
              />
          </div>
        </div>
        <div className="flex items-center gap-4">
            <Label className="shrink-0">Add participants</Label>
            <ParticipantSelect
                members={members.filter((m) => m.id !== form.leaderId && m.id !== currentUserId)}
                selectedIds={form.participantIds}
                onChange={(ids) => updateField("participantIds", ids)}
                onClear={() => updateField("participantIds", [])}
            />
        </div>          
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSave} disabled={saving || !form.customerId.trim()}>
            {saving ? <><Loader2 className="animate-spin"/>Saving...</> : isEditMode ? "Save changes" : "Create Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}