import InputError from '@/components/input-error';

export type RoleOption = {
    name: string;
    label: string;
    description: string | null;
};

/**
 * The roles of a user as a list of checkboxes. A user usually has one role,
 * but the permission system allows combining them (e.g. editor + moderator).
 */
export function RoleCheckboxes({
    roles,
    value,
    onChange,
    errors,
    disabled,
}: {
    roles: RoleOption[];
    value: string[];
    onChange: (value: string[]) => void;
    /** The form's errors; messages for single roles ("roles.0") are shown too. */
    errors?: Partial<Record<string, string>>;
    disabled?: boolean;
}) {
    const toggle = (name: string, checked: boolean) => {
        onChange(
            checked
                ? Array.from(new Set([...value, name]))
                : value.filter((role) => role !== name),
        );
    };

    const roleErrors = Object.entries(errors ?? {})
        .filter(([key]) => key.startsWith('roles.'))
        .map(([, message]) => message);

    return (
        <fieldset>
            <legend className="wp-screen-reader-text">Роли пользователя</legend>
            <div className="grid gap-2.5">
                {roles.map((role) => (
                    <label
                        key={role.name}
                        className="flex max-w-xl cursor-pointer items-start gap-2 text-[14px] text-[#1d2327]"
                    >
                        <input
                            type="checkbox"
                            className="mt-0.5 size-4 shrink-0 accent-[#2271b1]"
                            checked={value.includes(role.name)}
                            onChange={(event) =>
                                toggle(role.name, event.target.checked)
                            }
                            disabled={disabled}
                        />
                        <span>
                            {role.label}
                            {role.description && (
                                <span className="block text-[13px] text-[#646970]">
                                    {role.description}
                                </span>
                            )}
                        </span>
                    </label>
                ))}
            </div>
            {roleErrors.map((message) => (
                <InputError
                    key={message}
                    message={message}
                    className="mt-1.5 text-[13px]"
                />
            ))}
        </fieldset>
    );
}

const PASSWORD_ALPHABET =
    'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*()-_=+';

/** A strong random password, like WordPress's "Сгенерировать пароль". */
export function generatePassword(length = 20): string {
    const random = new Uint32Array(length);
    crypto.getRandomValues(random);

    return Array.from(
        random,
        (value) => PASSWORD_ALPHABET[value % PASSWORD_ALPHABET.length],
    ).join('');
}
