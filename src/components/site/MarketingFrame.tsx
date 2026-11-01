import Link from 'next/link';
import type { ReactNode } from 'react';

export function MarketingHeader() {
    return (
        <header className="border-b border-[#ded8cf] bg-[#f7f4ee]">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-5 py-4 sm:px-8">
                <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight text-[#171717]">
                    <img src="/logo.svg" alt="" className="size-10" />
                    <span>AI Library</span>
                </Link>
                <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm text-[#5c5751] sm:gap-7">
                    <Link href="/poses" className="hidden hover:text-[#171717] sm:inline">Poses</Link>
                    <Link href="/costumes" className="hidden hover:text-[#171717] sm:inline">Costumes</Link>
                    <Link href="/#demos" className="hidden hover:text-[#171717] sm:inline">Demos</Link>
                    <Link href="/poses" className="rounded-full bg-[#171717] px-4 py-2 font-medium text-white hover:bg-[#35312e]">
                        Open the library
                    </Link>
                </nav>
            </div>
        </header>
    );
}

export function MarketingFooter() {
    return (
        <footer className="border-t border-[#ded8cf] bg-[#f7f4ee] text-sm text-[#625d56]">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <p>AI Library · Visual references for creative work.</p>
                <nav aria-label="Legal" className="flex gap-5">
                    <Link href="/terms" className="hover:text-[#171717]">Terms</Link>
                    <Link href="/privacy" className="hover:text-[#171717]">Privacy</Link>
                    <a href="https://github.com/opensegra/ai-library/issues" className="hover:text-[#171717]">Contact</a>
                </nav>
            </div>
        </footer>
    );
}

export function MarketingFrame({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-dvh bg-[#f7f4ee] text-[#171717]">
            <MarketingHeader />
            {children}
            <MarketingFooter />
        </div>
    );
}

export function LegalLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
    return (
        <MarketingFrame>
            <main className="mx-auto max-w-4xl px-5 py-14 sm:px-8 sm:py-20">
                <Link href="/" className="text-sm text-[#7b7065] hover:text-[#171717]">← AI Library</Link>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-[#625d56]">{intro}</p>
                <div className="mt-12 space-y-10 text-[15px] leading-7 text-[#403c37]">{children}</div>
                <p className="mt-12 text-sm text-[#7b7065]">Last updated November 1, 2026.</p>
            </main>
        </MarketingFrame>
    );
}

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
    return (
        <section>
            <h2 className="mb-3 text-xl font-semibold tracking-tight text-[#171717]">{title}</h2>
            <div className="space-y-3">{children}</div>
        </section>
    );
}
