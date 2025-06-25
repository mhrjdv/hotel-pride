'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BedDouble,
  CalendarCheck,
  Users,
  BarChart3,
  Settings,
  Shield,
  PanelLeft,
  Hotel,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/reports', label: 'Reports', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
  {
    href: '/admin',
    label: 'Admin',
    icon: Shield,
    permission: 'admin',
  },
];

function NavLink({
  item,
  isMobile = false,
}: {
  item: (typeof navItems)[0];
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100',
        isActive && 'bg-gray-100 text-gray-900',
        isMobile && 'text-base'
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}

function NavContent() {
  const { hasPermission } = usePermissions();

  return (
    <nav className="grid items-start gap-2 text-sm font-medium">
      {navItems.map(
        (item) =>
          (!item.permission || hasPermission(item.permission as any)) && (
            <NavLink key={item.href} item={item} />
          )
      )}
    </nav>
  );
}

export function SideNav() {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-white sm:flex">
        <div className="flex h-16 items-center gap-2 border-b px-6">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">Hotel Pride</span>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <div className="px-4">
            <NavContent />
          </div>
        </div>
      </aside>

      {/* Mobile Sheet (Hamburger Menu) */}
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden absolute top-4 left-4 z-20">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <div className="flex h-16 items-center gap-2 border-b px-6">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Hotel Pride</span>
          </div>
          <div className="mt-4">
            <NavContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
} 