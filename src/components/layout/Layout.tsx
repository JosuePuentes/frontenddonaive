import type { ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type LayoutProps = {
  children: ReactNode;
  className?: string;
  showNavbar?: boolean;
  showFooter?: boolean;
};

function Layout({
  children,
  className,
  showNavbar = true,
  showFooter = true,
}: LayoutProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background", className)}>
      {showNavbar ? <Navbar /> : null}
      <main className="flex-1">{children}</main>
      {showFooter ? <Footer /> : null}
    </div>
  );
}

export { Layout };
export type { LayoutProps };
