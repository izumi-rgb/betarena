export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0E1A] text-white">
      <div className="text-center">
        <div className="mx-auto mb-4 h-14 w-14 animate-pulse rounded-xl border-2 border-[#00C37B] bg-[#0F172A]" />
        <div className="text-sm text-[#94A3B8]">Loading...</div>
      </div>
    </div>
  );
}
