export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen p-6 grid place-items-center bg-bg">
      {children}
    </div>
  );
}
