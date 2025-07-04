import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Settings, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const adminSections = [
    {
      title: 'User Management',
      description: 'Manage user roles and access.',
      href: '/admin/users',
      icon: <Users className="w-8 h-8 text-blue-500" />,
    },
    {
      title: 'System Settings',
      description: 'Configure hotel-wide settings.',
      href: '/admin/settings',
      icon: <Settings className="w-8 h-8 text-green-500" />,
    },
    {
      title: 'Security Logs',
      description: 'View audit trails and security events.',
      href: '/admin/logs',
      icon: <Shield className="w-8 h-8 text-red-500" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-500">
          Global system configuration and management.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link href={section.href} key={section.title}>
            <Card className="hover:shadow-lg transition-shadow duration-300 h-full">
              <CardHeader className="flex flex-row items-center gap-4">
                {section.icon}
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">{section.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
} 