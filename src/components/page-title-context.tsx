'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface PageTitleContextValue {
  title: string;
  setTitle: (title: string) => void;
}

const PageTitleContext = createContext<PageTitleContextValue | null>(null);

export function usePageTitle(): PageTitleContextValue | null {
  return useContext(PageTitleContext);
}

export function PageTitleProvider({
  initialTitle,
  children,
}: {
  initialTitle: string;
  children: React.ReactNode;
}) {
  const [title, setTitle] = useState(initialTitle);
  const setTitleStable = useCallback((t: string) => setTitle(t), []);
  return (
    <PageTitleContext.Provider value={{ title, setTitle: setTitleStable }}>
      {children}
    </PageTitleContext.Provider>
  );
}
