export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full p-6 flex flex-col items-center justify-center bg-bg overflow-x-hidden">
      {children}
    </div>
  );
}
