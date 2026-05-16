import { ReactNode, useState } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ConfirmButtonProps {
    onConfirm: () => void;
    title?: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'destructive' | 'default' | 'outline' | 'ghost' | 'secondary';
    size?: 'sm' | 'default' | 'lg' | 'icon';
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}

/**
 * Drop-in replacement for inline `if (confirm(...))` destructive buttons. Uses the
 * accessible Radix AlertDialog under the hood and centralizes copy across the admin.
 */
export function ConfirmButton({
    onConfirm,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Delete',
    cancelLabel = 'Cancel',
    variant = 'destructive',
    size = 'sm',
    disabled,
    className,
    children,
}: ConfirmButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <Button
                type="button"
                variant={variant}
                size={size}
                disabled={disabled}
                className={cn(className)}
                onClick={() => setOpen(true)}
            >
                {children}
            </Button>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>{description}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={() => {
                            setOpen(false);
                            onConfirm();
                        }}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
