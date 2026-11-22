import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <div className="mx-auto w-full max-w-md flex-1 px-5 pb-28 pt-[max(1.5rem,env(safe-area-inset-top))]">
        {children}
      </div>
      <BottomNav />
    </>
  );
}
