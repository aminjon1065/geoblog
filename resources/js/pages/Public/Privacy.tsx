import { usePage } from '@inertiajs/react';
import PageHero from '@/components/public/PageHero';
import Section from '@/components/public/Section';
import { SeoHead } from '@/components/public/SeoHead';
import PublicLayout from '@/layouts/public-layout';
import type { SharedData, PageData } from '@/types';

interface PrivacyProps extends SharedData {
    page: PageData;
}

export default function Privacy() {
    const { page, translations } = usePage<PrivacyProps>().props;
    const t = translations?.ui ?? {};

    return (
        <PublicLayout>
            <SeoHead
                title={
                    page?.title ??
                    t.privacy_policy ??
                    'Политика конфиденциальности'
                }
                description={
                    t.privacy_description ??
                    'Политика обработки персональных данных'
                }
            />

            <PageHero
                title={
                    page?.title ??
                    t.privacy_policy ??
                    'Политика конфиденциальности'
                }
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
                            {t.no_privacy_yet ??
                                'Политика конфиденциальности будет добавлена в ближайшее время.'}
                        </p>
                    </div>
                )}
            </Section>
        </PublicLayout>
    );
}
