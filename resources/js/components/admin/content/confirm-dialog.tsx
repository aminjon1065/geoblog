import { useState } from 'react';
import type { ReactNode } from 'react';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';

export type ConfirmRequest = {
    title: string;
    description?: ReactNode;
    confirmLabel?: string;
    onConfirm: () => void;
};

/**
 * One confirmation dialog per screen, opened from row actions, bulk
 * actions or buttons: `confirm({ title, onConfirm })`, then render
 * `dialog` once.
 */
export function useConfirmDialog(): {
    confirm: (request: ConfirmRequest) => void;
    dialog: ReactNode;
} {
    const [request, setRequest] = useState<ConfirmRequest | null>(null);

    const dialog = (
        <ConfirmDialog
            open={request !== null}
            onOpenChange={(open) => {
                if (!open) {
                    setRequest(null);
                }
            }}
            onConfirm={() => request?.onConfirm()}
            title={request?.title ?? ''}
            description={
                request?.description ?? 'Это действие нельзя будет отменить.'
            }
            confirmLabel={request?.confirmLabel ?? 'Да, удалить'}
        />
    );

    return { confirm: setRequest, dialog };
}
