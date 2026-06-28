'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X, User, Phone, Mail } from '@/components/icons';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const searchFieldOptions = [
  { value: 'all', label: 'All Fields', icon: User },
  { value: 'name', label: 'Name', icon: User },
  { value: 'phone', label: 'Phone', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
];

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchField, setSearchField] = useState(searchParams.get('field') || 'all');
  const isFirstRender = useRef(true);

  // Debounced URL sync — filters as you type, no separate Search button.
  useEffect(() => {
    // Skip the very first render so we don't push a redundant route on mount.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const handle = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      const value = searchTerm.trim();

      if (value) {
        params.set('search', value);
      } else {
        params.delete('search');
      }

      if (searchField !== 'all') {
        params.set('field', searchField);
      } else {
        params.delete('field');
      }

      const qs = params.toString();
      router.push(qs ? `/customers?${qs}` : '/customers');
    }, 300);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, searchField]);

  const clearSearch = () => {
    setSearchTerm('');
    setSearchField('all');
  };

  return (
    <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          type="search"
          placeholder="Search customers..."
          aria-label="Search customers"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-9"
        />
        {searchTerm && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label="Clear search"
            onClick={clearSearch}
            className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-gray-100"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      <Select value={searchField} onValueChange={setSearchField}>
        <SelectTrigger className="w-full sm:w-40" aria-label="Search field">
          <SelectValue placeholder="All Fields" />
        </SelectTrigger>
        <SelectContent>
          {searchFieldOptions.map((option) => {
            const Icon = option.icon;
            return (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {option.label}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
