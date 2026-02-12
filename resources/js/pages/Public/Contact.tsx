import { Head, usePage, useForm } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputError from '@/components/input-error';
import { url } from '@/lib/url';
import { MapPin, Mail, Phone, ArrowRight } from 'lucide-react';
import type { SharedData } from '@/types';

export default function Contact() {
    const { locale, translations, flash } = usePage<SharedData>().props;
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

    const contactItems = [
        {
            icon: MapPin,
            label: t.address ?? 'Адрес',
            value: t.address_value ?? 'г. Душанбе, Таджикистан',
        },
        {
            icon: Mail,
            label: t.email ?? 'Email',
            value: 'info@geologist.tj',
        },
        {
            icon: Phone,
            label: t.phone ?? 'Телефон',
            value: t.phone_value ?? '+992 (37) 221-00-00',
        },
    ];

    return (
        <PublicLayout>
            <Head title={t.nav_contact ?? 'Контакты'} />

            <PageHero
                title={t.nav_contact ?? 'Контакты'}
                subtitle={t.contact_info ?? 'Свяжитесь с нами'}
            />

            <Section>
                <div className="grid gap-12 lg:grid-cols-5">
                    {/* Form */}
                    <div className="lg:col-span-3">
                        <h2 className="mb-1.5 text-xl font-bold tracking-tight">
                            {t.contact_form ?? 'Напишите нам'}
                        </h2>
                        <p className="mb-6 text-sm text-muted-foreground">
                            {t.contact_form_desc ?? 'Заполните форму и мы свяжемся с вами в ближайшее время.'}
                        </p>

                        {flash?.success && (
                            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                                {t.contact_success ?? 'Ваше сообщение отправлено!'}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">{t.name ?? 'Имя'}</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.name} />
                                </div>

                                <div className="space-y-1.5">
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
                            </div>

                            <div className="space-y-1.5">
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

                            <button
                                type="submit"
                                disabled={processing}
                                className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                            >
                                {t.send ?? 'Отправить'}
                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="lg:col-span-2">
                        <div className="rounded-lg border border-border bg-secondary p-6 lg:p-8">
                            <h2 className="mb-6 text-lg font-bold">
                                {t.contact_info ?? 'Контактная информация'}
                            </h2>

                            <div className="space-y-5">
                                {contactItems.map((item) => (
                                    <div key={item.label} className="flex gap-3">
                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                            <item.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                                {item.label}
                                            </p>
                                            <p className="mt-0.5 text-sm text-foreground">
                                                {item.value}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Section>

            {/* Map */}
            <Section>
                <div className="overflow-hidden rounded-lg border border-border">
                    <iframe
                        src="https://www.openstreetmap.org/export/embed.html?bbox=68.74%2C38.54%2C68.80%2C38.58&layer=mapnik&marker=38.5598%2C68.7738"
                        width="100%"
                        height="400"
                        className="border-0"
                        loading="lazy"
                        title={t.map_title ?? 'Карта'}
                    />
                </div>
            </Section>
        </PublicLayout>
    );
}
