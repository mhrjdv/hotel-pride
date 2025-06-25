import { SideNav } from '@/components/layout/SideNav';
import { Header } from '@/components/layout/Header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900">
      <SideNav />
      <div className="lg:pl-64 flex flex-col flex-1">
        <Header />
        <main className="p-4 sm:p-6 lg:p-8 flex-1">{children}</main>
      </div>
    </div>
  );
} 