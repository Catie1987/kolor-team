'use client';
import { useUser } from '@clerk/nextjs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { LogOut, CalendarDays, ShieldCheck, Camera, PenLine, KeyRound , TriangleAlert, Loader2, Globe} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRef, useState } from 'react';
import {BasicInformationDialog} from "./basic-information-dialog"
import {WorkDialog} from "./work-dialog"
import {ChangePasswordDialog} from "./change-password-dialog"
import {SignOutDialog} from './signout-dialog'
import { format } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import Link from 'next/link';

export default function ViewProfile() {
    const { isLoaded, isSignedIn, user } = useUser();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const [workDialogOpen, setWorkDialogOpen] = useState(false);
    const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
    const [signoutDialogOpen, setSignoutDialogOpen] = useState(false);
    
    if (!isLoaded) {
        return (
        <div className="mx-auto max-w-lg p-6 animate-pulse">
            Loading...
        </div>
        );
    }
    
    if (!isSignedIn) {
        return null;
    }

    const initials = user.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'U';
    const role = (user.publicMetadata?.role as string) ?? "staff";
    const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;
    const workAt = (user.unsafeMetadata as {workAt?: string})?.workAt
    const branch = (user.unsafeMetadata as {branch?: string})?.branch
    const department = (user.unsafeMetadata as {department?: string})?.department
    const dateOfBirth = (user.unsafeMetadata as { dateOfBirth?: string })?.dateOfBirth;
    const personalPhone = (user.unsafeMetadata as { personalPhone?: string })?.personalPhone;
    const dob = dateOfBirth
    ? new Date(dateOfBirth).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        }).replace(/ /g, '-')
    : null;
    const lastSignIn = user.lastSignInAt
        ? format(user.lastSignInAt, 'HH:mm dd-MMM-yyyy')
        : '—';
    const bio = (user.unsafeMetadata as { bio?: string })?.bio;
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
    
        // Optional but recommended: basic client-side validation before
        // uploading — Clerk enforces its own limits server-side too, but
        // catching obvious issues early avoids a wasted round trip.
        if (!file.type.startsWith('image/')) {
        setError('Please choose an image file.');
        return;
        }
        if (file.size > 10 * 1024 * 1024) {
        setError('Image must be under 10MB.');
        return;
        }
    
        setError(null);
        setIsUploading(true);
        try {
        await user.setProfileImage({ file });
        // useUser() is reactive — user.imageUrl updates automatically once
        // this resolves, no need to manually update local state.
        } catch (err) {
        console.error(err);
        setError('Could not upload image. Please try again.');
        } finally {
        setIsUploading(false);
        // Reset the input so selecting the same file again still fires onChange
        e.target.value = '';
        }
    };
  return (
    <div className="w-full flex flex-col gap-4">
        <Card className="shadow-xs relative">
            <div className='flex flex-col @xl/main:flex-row justify-between gap-4'>
                <div className="flex flex-row items-center px-6 @xl/main:px-10 @4xl/main:px-15 gap-6 @xl/main:gap-8 @4xl/main:gap-10">
                    <div className='relative'>
                        <Avatar className="size-20 @xl/main:size-24 outline-3">
                            <AvatarImage src={user.imageUrl} alt={user.fullName ?? 'User'} />
                            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                        </Avatar>
                        <Button variant="ghost" 
                            className='absolute border-border rounded-full size-8 bg-muted hover:bg-muted bottom-0 right-0 shadow-xs'
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? (
                                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                            ) : (
                                <Camera size={16} className="text-muted-foreground" />
                            )}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                    </div>
                    <div className='flex flex-col gap-1'>
                        <div className="font-semibold text-xl text-primary flex items-center gap-4">
                            <p className='truncate'>{user.fullName}</p>
                            <Tooltip>
                            <TooltipTrigger render={
                                <Button size="icon-sm" variant="outline" className='text-muted-foreground absolute top-4 right-4 @xl/main:top-0 @xl/main:right-0 @xl/main:relative'>
                                    <Link href={`/dashboard/profile/${user.id}`}><Globe/></Link>
                                </Button>}
                                />
                            <TooltipContent side="bottom">View your public profile</TooltipContent>
                        </Tooltip>
                        </div>
                        <div className="flex items-center text-sm gap-4">
                            <span className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="size-4" />
                            Member since
                            </span>
                            <span className="font-medium">{joinedDate ?? '—'}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-muted-foreground">
                            <ShieldCheck className="size-4" />
                            Email verified
                            </span>
                            <Badge
                            variant={
                                user.primaryEmailAddress?.verification?.status === 'verified'
                                ? 'sales'
                                : 'outline'
                            }
                            >
                            {user.primaryEmailAddress?.verification?.status === 'verified'
                                ? 'Verified'
                                : 'Unverified'}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    className="gap-2 rounded-none @xl/main:rounded-lg border-0 @xl/main:border @xl/main:border-destructive @xl/main:mr-6 translate-y-6 @xl/main:translate-y-0"
                    onClick={() => setSignoutDialogOpen(true)}
                >
                    <LogOut className="size-4" />
                    <span className=''>Sign out</span>
                </Button> 
                <SignOutDialog isOpen={signoutDialogOpen} setIsOpen={setSignoutDialogOpen}/>                
            </div>
        </Card>
        <Card className="shadow-xs">
            <div className='flex flex-col w-full pl-6 @xl/main:pl-10 @4xl/main:pl-15 pr-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h1 className='text-lg text-primary'>Basic Information</h1>
                    <Button variant="outline" size="sm" onClick={() => setInfoDialogOpen(true)}>
                        Edit
                        <PenLine className='ml-2 size-3.5'/>
                    </Button>
                    <BasicInformationDialog isOpen={infoDialogOpen} setIsOpen={setInfoDialogOpen}/>
                </div>
                <Separator/>
                <div className='w-full grid grid-cols-2 @4xl/main:grid-cols-3'>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>First Name</p>
                        <span className='text-base'>{user.firstName}</span>
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Last Name</p>
                        <span className='text-base'>{user.lastName}</span>
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Date of birth</p>
                        {(user.unsafeMetadata as { dateOfBirth?: string })?.dateOfBirth ? (
                            <span className='text-base'>{dob}</span>
                        ) : (
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Email address</p>
                        <span className='text-base truncate'>{user.primaryEmailAddress?.emailAddress}</span>
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Phone number</p>
                        {personalPhone ? (
                            <span className='text-base'>{personalPhone}</span>
                        ): (
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>User Role</p>
                        <span className='text-base capitalize'>{role}</span>
                    </div>
                    <div className='flex flex-col gap-1 py-4 col-span-2 @4xl/main:col-span-3'>
                        <p className='text-sm text-muted-foreground'>Bio & Hobbies</p>
                        {bio ? (
                            <span className='text-base'>{bio}</span>
                        ):(
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
        <Card className="shadow-xs">
            <div className='flex flex-col w-full pl-6 @xl/main:pl-10 @4xl/main:pl-15 pr-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h1 className='text-lg text-primary'>Work Place</h1>
                    <Button variant="outline" size="sm" onClick={() => setWorkDialogOpen(true)}>
                        Edit
                        <PenLine className='ml-2 size-3.5'/>
                    </Button>
                    <WorkDialog isOpen={workDialogOpen} setIsOpen={setWorkDialogOpen}/>
                </div>
                <Separator/>
                <div className='w-full grid grid-cols-2 @4xl/main:grid-cols-3'>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Work at</p>
                        {workAt ? (
                            <span className='text-base'>{workAt}</span>
                        ):(
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Branch</p>
                        {branch ? (
                            <span className='text-base'>{branch}</span>
                        ):(
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                    <div className='flex flex-col gap-1 py-4'>
                        <p className='text-sm text-muted-foreground'>Department</p>
                        {department ? (
                            <span className='text-base'>{department}</span>
                        ):(
                            <span className='text-base text-muted-foreground'>not provided yet</span>
                        )}
                    </div>
                </div>
            </div>
        </Card>
        <Card className="shadow-xs">
            <div className='flex flex-col w-full pl-6 @xl/main:pl-10 @4xl/main:pl-15 pr-6'>
                <div className='flex items-center justify-between mb-4'>
                    <h1 className='text-lg text-primary'>Privacy</h1>
                    <Button variant="outline" size="sm" onClick={() => setChangePasswordDialogOpen(true)}>
                        Change Password
                    </Button>
                    <ChangePasswordDialog isOpen={changePasswordDialogOpen} setIsOpen={setChangePasswordDialogOpen}/>
                </div>
                <Separator/>
                <div className='w-full flex gap-2'>
                    <div className='w-full flex gap-2 @xl/main:gap-4 items-center'>
                        <div className='p-2 rounded-lg border text-muted-foreground bg-muted/50'>
                            <KeyRound/>
                        </div>
                        <div className='flex flex-col gap-1 py-4'>
                            <p className='text-base'>Current Password</p>
                            <span className='text-sm text-muted-foreground'>Last Sign In {lastSignIn}</span>
                        </div>
                    </div>
                    
                </div>
                <div className='flex gap-2 mx-auto'>
                    <TriangleAlert className='size-4 text-orange-600 mt-0.5'/>
                    <span className='text-orange-600 max-w-md w-full text-sm'>Do not share these keys with anyone. If you suspect that one of your secret keys has been compromised, you should ask your admin to reset pasword for you. Kisco support will never ask you to share your sign in password.</span>
                </div>
            </div>                       
        </Card>
    </div>
  )
}
