'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';
import { AddCustomerForm } from './AddCustomerForm';

export function AddCustomerButton() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <UserPlus className="mr-2 h-4 w-4" />
        Add New Customer
      </Button>
      <AddCustomerForm isOpen={isOpen} onOpenChange={setIsOpen} />
    </>
  );
} 