import { Form } from '@inertiajs/react';
import { useRef } from 'react';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import { FormRow, FormTable, fieldClass } from '@/components/admin/form-table';

/**
 * "Новый пароль" of the profile: the current password plus the new one,
 * twice. Used on the profile screen and on the separate password screen.
 */
export function UpdatePasswordForm() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);

    return (
        <Form
            {...PasswordController.update.form()}
            options={{ preserveScroll: true }}
            resetOnError={[
                'password',
                'password_confirmation',
                'current_password',
            ]}
            resetOnSuccess
            onError={(errors) => {
                if (errors.password) {
                    passwordInput.current?.focus();
                }

                if (errors.current_password) {
                    currentPasswordInput.current?.focus();
                }
            }}
        >
            {({ errors, processing }) => (
                <FormTable>
                    <FormRow
                        label="Текущий пароль"
                        htmlFor="current_password"
                        error={errors.current_password}
                    >
                        <input
                            id="current_password"
                            ref={currentPasswordInput}
                            name="current_password"
                            type="password"
                            className={fieldClass.regular}
                            autoComplete="current-password"
                        />
                    </FormRow>
                    <FormRow
                        label="Новый пароль"
                        htmlFor="password"
                        error={errors.password}
                        description="Используйте длинный пароль из случайных слов, цифр и знаков — и не повторяйте его на других сайтах."
                    >
                        <input
                            id="password"
                            ref={passwordInput}
                            name="password"
                            type="password"
                            className={fieldClass.regular}
                            autoComplete="new-password"
                        />
                    </FormRow>
                    <FormRow
                        label="Подтверждение пароля"
                        htmlFor="password_confirmation"
                        error={errors.password_confirmation}
                    >
                        <input
                            id="password_confirmation"
                            name="password_confirmation"
                            type="password"
                            className={fieldClass.regular}
                            autoComplete="new-password"
                        />
                        <p className="mt-3">
                            <button
                                type="submit"
                                className="wp-button"
                                disabled={processing}
                                data-test="update-password-button"
                            >
                                Обновить пароль
                            </button>
                        </p>
                    </FormRow>
                </FormTable>
            )}
        </Form>
    );
}
