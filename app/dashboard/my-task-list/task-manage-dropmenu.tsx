import React from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import { MyTaskGroup, ProjectTask } from '@/lib/actions/project-tasks';

interface TaskManageDropmenuProps {
    group: MyTaskGroup;
    groupIndex: number;
    task: ProjectTask;
    onEditTask: (group: MyTaskGroup, task: ProjectTask)=>void;
    onDeleteTask: (groupIndex: number, taskId: string) =>void;
}

export function TaskManageDropmenu({group, groupIndex, task, onEditTask, onDeleteTask}: TaskManageDropmenuProps) {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
            <EllipsisVertical/>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="">
            <DropdownMenuGroup>
                <DropdownMenuItem onClick={()=>onEditTask(group, task)}>
                    <Pencil/>
                    Edit
                </DropdownMenuItem>
                <DropdownMenuItem variant='destructive' onClick={() => onDeleteTask(groupIndex, task.id)}>
                    <Trash2/>
                    Delete
                </DropdownMenuItem>
            </DropdownMenuGroup>
        </DropdownMenuContent>
    </DropdownMenu>
  )
}
