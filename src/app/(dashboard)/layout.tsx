'use client';

import { SideNav } from '@/components/layout/SideNav';
import { Header } from '@/components/layout/Header';
import { SidebarProvider, useSidebar } from '@/components/layout/SidebarContext';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <SideNav />
      <div
        className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'sm:pl-16' : 'sm:pl-64'
        }`}
      >
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <DashboardContent>{children}</DashboardContent>
    </SidebarProvider>
  );
}