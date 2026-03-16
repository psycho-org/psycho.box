'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest } from '@/lib/client';

export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/54d72956-08dc-43e8-b578-f219e74b41b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:mount',message:'AuthProvider mount',data:{path:typeof window!=='undefined'?window.location.pathname:'ssr'},timestamp:Date.now(),hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/54d72956-08dc-43e8-b578-f219e74b41b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:useEffect',message:'AuthProvider fetch started',data:{path:typeof window!=='undefined'?window.location.pathname:'ssr'},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    apiRequest<{ user?: AuthUser }>('/api/real/auth/me')
      .then((result) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/54d72956-08dc-43e8-b578-f219e74b41b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:then',message:'AuthProvider fetch result',data:{ok:result.ok,hasUser:!!result.data?.user,status:result.status},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
        setUser((prev) => (result.ok && result.data?.user ? result.data.user : prev));
      })
      .catch((err) => {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/54d72956-08dc-43e8-b578-f219e74b41b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:catch',message:'AuthProvider fetch error',data:{err:String(err)},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
        // #endregion
      })
      .finally(() => {
        setLoading(false);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/54d72956-08dc-43e8-b578-f219e74b41b2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-provider.tsx:finally',message:'AuthProvider loading=false',data:{},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
        // #endregion
      });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
