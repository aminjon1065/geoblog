import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';

export default function SocialFloatingButton() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Social Media Links */}
            <div
                className={`mb-3 flex flex-col gap-3 transition-all duration-300 ${
                    isOpen
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-4 opacity-0'
                }`}
            >
                {/* WhatsApp Button */}
                <a
                    href="https://wa.me/992900123456"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                    title="WhatsApp"
                >
                    <MessageCircle className="h-5 w-5" />
                </a>

                {/* Telegram Button */}
                <a
                    href="https://t.me/geologists_tj"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-12 w-12 items-center justify-center rounded-full bg-[#0088cc] text-white shadow-lg transition-all hover:scale-110 hover:shadow-xl"
                    title="Telegram"
                >
                    <Send className="h-5 w-5" />
                </a>
            </div>

            {/* Main Toggle Button */}
            <button
                onClick={toggleMenu}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all hover:scale-110 hover:shadow-2xl"
                aria-label="Toggle social media menu"
            >
                <div className="relative h-6 w-6">
                    <MessageCircle
                        className={`absolute inset-0 transition-all duration-300 ${
                            isOpen
                                ? 'rotate-90 scale-0 opacity-0'
                                : 'rotate-0 scale-100 opacity-100'
                        }`}
                    />
                    <X
                        className={`absolute inset-0 transition-all duration-300 ${
                            isOpen
                                ? 'rotate-0 scale-100 opacity-100'
                                : '-rotate-90 scale-0 opacity-0'
                        }`}
                    />
                </div>
            </button>
        </div>
    );
}
