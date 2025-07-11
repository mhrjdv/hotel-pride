'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/components/auth/AuthProvider';
import { useSidebar } from './SidebarContext';
import { Button } from '@/components/ui/button';

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
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/rooms', label: 'Rooms', icon: BedDouble },
  { href: '/bookings', label: 'Bookings', icon: CalendarCheck },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/invoices', label: 'Invoices', icon: FileText },
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
  isCollapsed = false,
  isMobile = false,
}: {
  item: (typeof navItems)[0];
  isCollapsed?: boolean;
  isMobile?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname === item.href;
  const { closeMobile } = useSidebar();

  const linkContent = (
    <Link
      href={item.href}
      onClick={isMobile ? closeMobile : undefined}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 hover:bg-gray-100 group relative',
        isActive && 'bg-blue-100 text-blue-900 hover:bg-blue-100',
        isMobile && 'text-base',
        isCollapsed && 'justify-center px-2'
      )}
    >
      <item.icon className={cn('h-5 w-5', isActive && 'text-blue-600')} />
      {!isCollapsed && (
        <span className={cn('transition-opacity', isCollapsed && 'opacity-0')}>
          {item.label}
        </span>
      )}
    </Link>
  );

  // TODO: Add tooltip when collapsed (tooltip component needs to be fixed)
  // if (isCollapsed && !isMobile) {
  //   return (
  //     <Tooltip>
  //       <TooltipTrigger asChild>
  //         {linkContent}
  //       </TooltipTrigger>
  //       <TooltipContent side="right" className="ml-2">
  //         {item.label}
  //       </TooltipContent>
  //     </Tooltip>
  //   );
  // }

  return linkContent;
}

function NavContent({ isCollapsed = false, isMobile = false }: { isCollapsed?: boolean; isMobile?: boolean }) {
  const { hasPermission } = usePermissions();

  return (
    <nav className="grid items-start gap-2 text-sm font-medium">
      {navItems.map(
        (item) =>
          (!item.permission || hasPermission(item.permission as 'admin' | 'manager' | 'staff' | 'receptionist')) && (
            <NavLink key={item.href} item={item} isCollapsed={isCollapsed} isMobile={isMobile} />
          )
      )}
    </nav>
  );
}

export function SideNav() {
  const { isCollapsed, isMobileOpen, toggleCollapsed, toggleMobile, closeMobile } = useSidebar();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden flex-col border-r bg-white sm:flex transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-16 items-center border-b transition-all duration-300',
          isCollapsed ? 'justify-center px-2' : 'gap-2 px-6'
        )}>
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Hotel className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <span className="text-xl font-bold transition-opacity duration-300">
              Hotel Pride
            </span>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-auto py-4">
          <div className={cn('transition-all duration-300', isCollapsed ? 'px-2' : 'px-4')}>
            <NavContent isCollapsed={isCollapsed} />
          </div>
        </div>

        {/* Collapse Toggle Button */}
        <div className={cn(
          'border-t p-4 transition-all duration-300',
          isCollapsed ? 'px-2' : 'px-4'
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapsed}
            className={cn(
              'w-full transition-all duration-300',
              isCollapsed ? 'px-2' : 'justify-start'
            )}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 sm:hidden"
          onClick={closeMobile}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex-col border-r bg-white sm:hidden transition-transform duration-300 ease-in-out',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Mobile Header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Hotel className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">Hotel Pride</span>
          </div>
          <Button variant="ghost" size="sm" onClick={closeMobile}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        <div className="flex-1 overflow-auto py-4">
          <div className="px-4">
            <NavContent isMobile={true} />
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <Button
        size="icon"
        variant="outline"
        className="sm:hidden fixed top-4 left-4 z-30 bg-white shadow-md"
        onClick={toggleMobile}
      >
        <PanelLeft className="h-5 w-5" />
        <span className="sr-only">Toggle Menu</span>
      </Button>
    </>
  );
}