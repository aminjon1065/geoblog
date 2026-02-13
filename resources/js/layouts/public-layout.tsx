import type { ReactNode } from 'react';
import Footer from '@/components/public/layouts/Footer';
import Header from '@/components/public/layouts/Header';
import SocialFloatingButton from '@/components/public/SocialFloatingButton';

export default function PublicLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <SocialFloatingButton />
        </div>
    );
}
