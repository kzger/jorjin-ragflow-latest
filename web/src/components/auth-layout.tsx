import { PropsWithChildren } from 'react';
import { BrandLogo } from './brand-logo';
import { LanguageButton } from './language-button';
import ThemeButton from '@/layouts/components/theme-button';

export function AuthLayout({ children }: PropsWithChildren) {
  return (
    <main className="auth-layout min-h-dvh overflow-auto px-4 py-8 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-md flex-col justify-center">
        <section className="rounded-2xl border border-border-button bg-bg-component p-6 shadow-xl sm:p-8">
          <a
            href="https://jorjin.com/"
            target="_blank"
            rel="noreferrer noopener"
            className="mb-6 block"
          >
            <BrandLogo className="mx-auto w-full max-w-80" />
          </a>
          <div className="mb-6 flex justify-end gap-1">
            <LanguageButton />
            <ThemeButton />
          </div>
          {children}
        </section>
        <a
          href="https://jorjin.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="mt-6 text-center text-sm text-text-secondary hover:text-primary"
        >
          Jorjin
        </a>
      </div>
    </main>
  );
}
