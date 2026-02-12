import type { ReactNode } from 'react';
import Footer from '@/components/public/layouts/Footer';
import Header from '@/components/public/layouts/Header';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    );
}
