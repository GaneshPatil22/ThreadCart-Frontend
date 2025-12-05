import type { ReactNode } from "react";

interface StaticPageLayoutProps {
  title: string;
  children: ReactNode;
}

export default function StaticPageLayout({ title, children }: StaticPageLayoutProps) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-text-primary mb-8">{title}</h1>
      <div className="prose prose-gray max-w-none text-text-secondary">
        {children}
      </div>
    </div>
  );
}
