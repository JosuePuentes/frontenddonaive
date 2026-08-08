import { Outlet } from "react-router";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type LayoutProps = {
  className?: string;
};

function Layout({ className }: LayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export { Layout };
export type { LayoutProps };
