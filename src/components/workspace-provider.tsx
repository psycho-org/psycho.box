'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/client';

interface WorkspaceContextValue {
  workspaceId: string;
  workspaceName: string | null;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

/** 워크스페이스 레이아웃 내부에서만 사용. 외부에서 호출 시 에러. */
export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return ctx;
}

/** WorkspaceSwitcher처럼 context 밖에서도 렌더링될 수 있는 컴포넌트용. */
export function useWorkspaceOptional() {
  return useContext(WorkspaceContext);
}

export function WorkspaceProvider({
  workspaceId,
  children,
}: {
  workspaceId: string;
  children: React.ReactNode;
}) {
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<{ id?: string; name?: string; title?: string }>(
      `/api/real/workspaces/${workspaceId}`,
    ).then((result) => {
      if (result.ok && result.data) {
        setWorkspaceName(result.data.name ?? result.data.title ?? '워크스페이스');
      } else {
        setWorkspaceName('워크스페이스');
      }
    }).catch(() => {
      setWorkspaceName('워크스페이스');
    });
  }, [workspaceId]);

  return (
    <WorkspaceContext.Provider value={{ workspaceId, workspaceName }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
