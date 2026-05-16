import { Head, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { SharedData } from '@/types';

interface SeoHeadProps {
    title?: string | null;
    description?: string | null;
    /** Absolute URL of an image used for og:image / twitter:image. */
    image?: string | null;
    /** Override the auto-derived canonical (from shared `seo.canonical`). */
    canonical?: string | null;
    /** "website" by default — pass "article" for post pages. */
    ogType?: 'website' | 'article';
    /** ISO date string for article:published_time. */
    publishedTime?: string | null;
    /** ISO date string for article:modified_time. */
    modifiedTime?: string | null;
    /** Article author name. */
    author?: string | null;
    /**
     * JSON-LD blocks to inject as `<script type="application/ld+json">`.
     * Pass a single object or an array of objects.
     */
    structuredData?: Record<string, unknown> | Record<string, unknown>[] | null;
    children?: ReactNode;
}

export function SeoHead({
    title,
    description,
    image,
    canonical,
    ogType = 'website',
    publishedTime,
    modifiedTime,
    author,
    structuredData,
    children,
}: SeoHeadProps) {
    const { seo } = usePage<SharedData>().props;
    const resolvedCanonical = canonical ?? seo?.canonical ?? null;
    const alternates = seo?.alternates ?? [];
    const locale = seo?.locale ?? null;

    const structuredArray: Record<string, unknown>[] = structuredData == null
        ? []
        : Array.isArray(structuredData)
            ? structuredData
            : [structuredData];

    return (
        <Head title={title ?? undefined}>
            {description && <meta name="description" content={description} />}

            {/* OpenGraph */}
            <meta property="og:type" content={ogType} />
            {title && <meta property="og:title" content={title} />}
            {description && <meta property="og:description" content={description} />}
            {resolvedCanonical && <meta property="og:url" content={resolvedCanonical} />}
            {locale && <meta property="og:locale" content={locale} />}
            {image && <meta property="og:image" content={image} />}

            {/* Article-specific OpenGraph */}
            {ogType === 'article' && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {ogType === 'article' && modifiedTime && (
                <meta property="article:modified_time" content={modifiedTime} />
            )}
            {ogType === 'article' && author && (
                <meta property="article:author" content={author} />
            )}

            {/* Twitter Card */}
            <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
            {title && <meta name="twitter:title" content={title} />}
            {description && <meta name="twitter:description" content={description} />}
            {image && <meta name="twitter:image" content={image} />}

            {/* Canonical */}
            {resolvedCanonical && <link rel="canonical" href={resolvedCanonical} />}

            {/* hreflang alternates (Google requires them on every page) */}
            {alternates.map((alt) => (
                <link
                    key={`hreflang-${alt.locale}`}
                    rel="alternate"
                    hrefLang={alt.locale}
                    href={alt.url}
                />
            ))}

            {/* JSON-LD structured data */}
            {structuredArray.map((data, i) => (
                <script
                    key={`ld-json-${i}`}
                    type="application/ld+json"
                    // eslint-disable-next-line react/no-danger
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
                    }}
                />
            ))}

            {children}
        </Head>
    );
}
