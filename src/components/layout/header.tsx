'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { UserNav } from '@/components/user-nav';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '#', label: 'Use Cases' },
  { href: '/reports', label: 'My Reports' },
  { href: '/help', label: 'Help' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-primary/10">
      <div className="container flex h-20 max-w-7xl items-center px-4">
        <div className="mr-8 flex items-center">
          <Link href="/" className="mr-10 flex items-center transition-transform hover:scale-105">
            <Logo />
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold tracking-wide">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition-all hover:text-primary text-foreground/70 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-6">
          <Button variant="ghost" className="hidden sm:inline-flex font-bold hover:bg-primary/5 rounded-full px-6 border border-primary/20">
            Insights
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  );
}
