import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * "Удалить учётную запись" of the profile screen. The only super
 * administrator can't delete themselves — the server refuses too.
 */
export default function DeleteUser({
    canDelete = true,
}: {
    canDelete?: boolean;
}) {
    const passwordInput = useRef<HTMLInputElement>(null);

    if (!canDelete) {
        return (
            <p className="max-w-xl text-[13px] text-[#50575e]">
                Вы — единственный суперадминистратор сайта, поэтому удалить эту
                учётную запись нельзя. Сначала назначьте роль
                «Суперадминистратор» другому пользователю.
            </p>
        );
    }

    return (
        <div className="max-w-xl space-y-2">
            <p className="text-[13px] text-[#50575e]">
                Учётная запись и доступ к панели управления будут удалены без
                возможности восстановления.
            </p>

            <Dialog>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="wp-button is-link-danger px-0!"
                        data-test="delete-user-button"
                    >
                        Удалить учётную запись
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogTitle>Удалить вашу учётную запись?</DialogTitle>
                    <DialogDescription>
                        После удаления вы не сможете войти на сайт, а ваши
                        данные будут стёрты. Введите пароль, чтобы подтвердить
                        удаление.
                    </DialogDescription>

                    <Form
                        {...ProfileController.destroy.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        onError={() => passwordInput.current?.focus()}
                        resetOnSuccess
                        className="space-y-6"
                    >
                        {({ resetAndClearErrors, processing, errors }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor="delete-account-password"
                                        className="sr-only"
                                    >
                                        Пароль
                                    </Label>

                                    <Input
                                        id="delete-account-password"
                                        type="password"
                                        name="password"
                                        ref={passwordInput}
                                        placeholder="Пароль"
                                        autoComplete="current-password"
                                    />

                                    <InputError message={errors.password} />
                                    <InputError message={errors.account} />
                                </div>

                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                resetAndClearErrors()
                                            }
                                        >
                                            Отмена
                                        </Button>
                                    </DialogClose>

                                    <Button
                                        variant="destructive"
                                        disabled={processing}
                                        asChild
                                    >
                                        <button
                                            type="submit"
                                            data-test="confirm-delete-user-button"
                                        >
                                            Удалить учётную запись
                                        </button>
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
