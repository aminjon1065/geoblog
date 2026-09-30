import type { ReactNode } from 'react';
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

/**
 * WordPress asks "…навсегда удалить…? «Отмена» — для отмены, «OK» — для
 * удаления" in a browser confirm; this is the same question, accessible.
 */
export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    confirmLabel = 'Удалить навсегда',
    onConfirm,
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel?: string;
    onConfirm: () => void;
    children?: ReactNode;
}) {
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent className="gap-3 rounded-[4px] p-5 sm:max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-[16px] font-semibold text-[#1d2327]">
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-[13px] text-[#3c434a]">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                {children}
                <AlertDialogFooter className="mt-2">
                    <AlertDialogCancel className="h-[30px] rounded-[3px] px-3 text-[13px] font-normal">
                        Отмена
                    </AlertDialogCancel>
                    <AlertDialogAction
                        className="h-[30px] rounded-[3px] bg-[#d63638] px-3 text-[13px] font-normal text-white hover:bg-[#b32d2e]"
                        onClick={onConfirm}
                    >
                        {confirmLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
