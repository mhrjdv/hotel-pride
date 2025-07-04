'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, X, User, Phone, Mail, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

export function CustomerSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [searchType, setSearchType] = useState('all');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    const params = new URLSearchParams(searchParams);
    if (value.trim()) {
      params.set('search', value.trim());
    } else {
      params.delete('search');
    }
    
    // Include search type if specific
    if (searchType !== 'all') {
      params.set('type', searchType);
    } else {
      params.delete('type');
    }
    
    router.push(`/customers?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchType('all');
    const params = new URLSearchParams(searchParams);
    params.delete('search');
    params.delete('type');
    router.push(`/customers?${params.toString()}`);
  };

  const handleQuickFilter = (filter: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set(filter, value);
    router.push(`/customers?${params.toString()}`);
  };

  const searchTypeOptions = [
    { value: 'all', label: 'All Fields', icon: User },
    { value: 'name', label: 'Name', icon: User },
    { value: 'phone', label: 'Phone', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'location', label: 'Location', icon: MapPin },
  ];

  const activeFilters = [];
  if (searchParams.get('status')) activeFilters.push({ key: 'status', value: searchParams.get('status') });
  if (searchParams.get('tier')) activeFilters.push({ key: 'tier', value: searchParams.get('tier') });
  if (searchParams.get('blacklisted')) activeFilters.push({ key: 'blacklisted', value: 'true' });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {/* Main Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(searchTerm);
              }
            }}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Search Type Selector */}
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Search in..." />
          </SelectTrigger>
          <SelectContent>
            {searchTypeOptions.map((option) => {
              const Icon = option.icon;
              return (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>

        {/* Search Button */}
        <Button onClick={() => handleSearch(searchTerm)}>
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>

        {/* Filters Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {activeFilters.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-4 w-4 p-0 text-xs">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleQuickFilter('status', 'active')}>
              <User className="mr-2 h-4 w-4" />
              Active Customers
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleQuickFilter('blacklisted', 'true')}>
              <User className="mr-2 h-4 w-4" />
              Blacklisted Customers
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={() => handleQuickFilter('tier', 'platinum')}>
              💎 Platinum Customers
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleQuickFilter('tier', 'gold')}>
              🥇 Gold Customers
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleQuickFilter('tier', 'silver')}>
              🥈 Silver Customers
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {activeFilters.length > 0 && (
              <DropdownMenuItem onClick={clearSearch}>
                <X className="mr-2 h-4 w-4" />
                Clear All Filters
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Active Filters Display */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>
          {activeFilters.map((filter) => (
            <Badge
              key={`${filter.key}-${filter.value}`}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {filter.key}: {filter.value}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const params = new URLSearchParams(searchParams);
                  params.delete(filter.key);
                  router.push(`/customers?${params.toString()}`);
                }}
                className="h-4 w-4 p-0 hover:bg-gray-200 ml-1"
              >
                <X className="w-2 h-2" />
              </Button>
            </Badge>
          ))}
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="text-xs"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  );
} 