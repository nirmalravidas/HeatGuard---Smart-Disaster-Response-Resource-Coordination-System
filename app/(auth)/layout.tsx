export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8 sm:p-8">
      <div className="w-full max-w-md sm:max-w-xl">{children}</div>
    </div>
  );
}