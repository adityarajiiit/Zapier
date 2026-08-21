import { auth } from "../../auth";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { AppSidebar } from "./components/ui/Sidebar";
import { PageTransition } from "./components/ui/PageTransition";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-base-100">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto w-full md:min-w-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          classNames: {
            toast: "bg-base-300 border-base-content/10 text-base-content",
          },
        }}
      />
    </div>
  )
}
