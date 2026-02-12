import { Head, usePage } from '@inertiajs/react';
import PublicLayout from '@/layouts/public-layout';
import Section from '@/components/public/Section';
import PageHero from '@/components/public/PageHero';
import type { SharedData, PageData } from '@/types';

interface PrivacyProps extends SharedData {
    page: PageData;
}

export default function Privacy() {
    const { page, translations } = usePage<PrivacyProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <Head title={page?.title ?? t.privacy_policy ?? 'Политика конфиденциальности'}>
                <meta name="description" content={t.privacy_description ?? 'Политика обработки персональных данных'} />
            </Head>

            <PageHero
                title={page?.title ?? t.privacy_policy ?? 'Политика конфиденциальности'}
                subtitle={t.privacy_policy ?? 'Политика конфиденциальности'}
            />

            <Section>
                {page?.content ? (
                    <div
                        className="prose-public mx-auto max-w-3xl"
                        dangerouslySetInnerHTML={{ __html: page.content }}
                    />
                ) : (
                    <div className="mx-auto max-w-3xl text-center">
                        <p className="text-lg text-muted-foreground">
                            {t.no_privacy_yet ?? 'Политика конфиденциальности будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
