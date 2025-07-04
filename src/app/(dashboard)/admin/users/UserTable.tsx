'use client';

import { useState, useTransition } from 'react';
import { Database } from '@/lib/supabase/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { toast } from 'sonner';
import { updateUserRole, updateUserStatus } from '../actions';
import { Loader2 } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface UserTableProps {
  users: Profile[];
}

export function UserTable({ users: initialUsers }: UserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (userId: string, newRole: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('role', newRole);
      
      const result = await updateUserRole(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('User role updated successfully.');
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole as Profile['role'] } : u));
      }
    });
  };

  const handleStatusChange = (userId: string, newStatus: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('isActive', String(newStatus));

      const result = await updateUserStatus(formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success('User status updated successfully.');
        setUsers(users.map(u => u.id === userId ? { ...u, is_active: newStatus } : u));
      }
    });
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.full_name || 'N/A'}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Select
                  defaultValue={user.role}
                  onValueChange={(value) => handleRoleChange(user.id, value)}
                  disabled={isPending}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="receptionist">Receptionist</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={user.is_active ? 'default' : 'secondary'}>
                  {user.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Switch
                  checked={user.is_active}
                  onCheckedChange={(checked) => handleStatusChange(user.id, checked)}
                  disabled={isPending}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isPending && (
        <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      )}
    </div>
  );
} 