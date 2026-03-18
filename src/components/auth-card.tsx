import { PropsWithChildren } from 'react';

interface AuthCardProps extends PropsWithChildren {
  title: string;
}

export function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="w-full max-w-[640px] mx-auto bg-surface border border-line rounded-card p-6 shadow-overlay">
      <p className="m-0 text-accent-soft text-xs uppercase tracking-[0.08em]">Psycho.Box</p>
      <h1 className="mt-2.5 mb-1.5 text-[30px]">{title}</h1>
      <div className="mt-[18px]">{children}</div>
    </div>
  );
}
