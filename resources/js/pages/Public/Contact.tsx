import { Head, usePage } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { url } from '@/lib/url';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Contact() {
    const { locale, translations, flash } = usePage().props as any;
    const t = translations?.ui ?? {};

    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        message: '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(url('/contact', locale), {
            onSuccess: () => reset(),
        });
    }

    return (
        <PublicLayout>
            <Head title={t.nav_contact ?? 'Контакты'} />

            <section className="bg-primary py-20 text-primary-foreground">
                <div className="container">
                    <h1 className="text-4xl font-bold md:text-5xl">
                        {t.nav_contact ?? 'Контакты'}
                    </h1>
                </div>
            </section>

            <Section title="">
                <div className="grid gap-12 md:grid-cols-2">
                    <div>
                        <h2 className="mb-6 text-2xl font-bold">
                            {t.contact_form ?? 'Напишите нам'}
                        </h2>

                        {(flash as any)?.success && (
                            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                                {t.contact_success ?? 'Ваше сообщение отправлено!'}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">{t.name ?? 'Имя'}</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div>
                                <Label htmlFor="email">{t.email ?? 'Email'}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div>
                                <Label htmlFor="message">{t.message ?? 'Сообщение'}</Label>
                                <textarea
                                    id="message"
                                    rows={5}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    required
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <InputError message={errors.message} />
                            </div>

                            <Button type="submit" disabled={processing}>
                                {t.send ?? 'Отправить'}
                            </Button>
                        </form>
                    </div>

                    <div className="space-y-8">
                        <h2 className="mb-6 text-2xl font-bold">
                            {t.contact_info ?? 'Контактная информация'}
                        </h2>

                        <div className="flex gap-4">
                            <MapPin className="mt-1 h-5 w-5 shrink-0 text-primary" />
                            <div>
                                <p className="font-medium">{t.address ?? 'Адрес'}</p>
                                <p className="text-muted-foreground">
                                    {t.address_value ?? 'г. Душанбе, Таджикистан'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" />
                            <div>
                                <p className="font-medium">{t.email ?? 'Email'}</p>
                                <p className="text-muted-foreground">info@geologist.tj</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Phone className="mt-1 h-5 w-5 shrink-0 text-primary" />
                            <div>
                                <p className="font-medium">{t.phone ?? 'Телефон'}</p>
                                <p className="text-muted-foreground">{t.phone_value ?? '+992 (37) 221-00-00'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Section>
        </PublicLayout>
    );
}
