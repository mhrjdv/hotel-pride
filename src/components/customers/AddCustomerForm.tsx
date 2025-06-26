'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { getSignedUrls } from '@/app/(dashboard)/customers/actions';
import { Database } from '@/lib/supabase/types';

const idTypes = [
  'aadhaar',
  'pan',
  'passport',
  'driving_license',
  'voter_id',
] as const;

const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  phone: z
    .string()
    .regex(/^\+91[0-9]{10}$/, 'Phone number must be in +91XXXXXXXXXX format.'),
  email: z.string().email('Invalid email address.').optional().or(z.literal('')),
  id_type: z.enum(idTypes),
  id_number: z.string().min(5, 'ID number seems too short.'),
  address_line1: z.string().min(5, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  pin_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian PIN code.'),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type Customer = Database['public']['Tables']['customers']['Row'];

interface AddCustomerFormProps {
  customer?: Customer;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function AddCustomerForm({ customer, isOpen, onOpenChange }: AddCustomerFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = customer !== undefined;

  const [existingPhotos, setExistingPhotos] = useState<{path: string, url: string}[]>([]);
  const [newPhotos, setNewPhotos] = useState<{file: File, url: string}[]>([]);
  
  const [isFetchingUrls, startUrlTransition] = useTransition();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      phone: '+91',
      email: '',
      id_type: 'aadhaar',
      id_number: '',
      address_line1: '',
      city: '',
      state: '',
      pin_code: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && customer) {
        form.reset({
          name: customer.name,
          phone: customer.phone,
          email: customer.email || '',
          id_type: customer.id_type,
          id_number: customer.id_number,
          address_line1: customer.address_line1 || '',
          city: customer.city || '',
          state: customer.state || '',
          pin_code: customer.pin_code || '',
          notes: customer.notes || '',
        });

        if (customer.id_photo_urls && customer.id_photo_urls.length > 0) {
          startUrlTransition(async () => {
            const result = await getSignedUrls(customer.id_photo_urls as string[]);
            if (result.success && result.urls) {
              const photoData = customer.id_photo_urls!.map((path, index) => ({
                path: path!,
                url: result.urls![index],
              }));
              setExistingPhotos(photoData);
            } else {
              toast.error("Could not load existing ID photos.");
            }
          });
        }
        setNewPhotos([]);
      } else {
        form.reset();
        setExistingPhotos([]);
        setNewPhotos([]);
      }
    }
  }, [customer, isEditMode, isOpen, form, startUrlTransition]);

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    toast.info(isEditMode ? 'Updating customer...' : 'Adding new customer...');

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id_photos' && value) {
        formData.append(key, value as string);
      }
    });

    if (newPhotos.length > 0) {
      for (const photo of newPhotos) {
        try {
          const compressedFile = await imageCompression(photo.file, {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          formData.append('id_photos', compressedFile);
        } catch (error) {
          toast.error(`Failed to compress image: ${photo.file.name}`);
          setIsSubmitting(false);
          return;
        }
      }
    }
    
    const existingPhotoPaths = existingPhotos.map(p => p.path);
    formData.append('existingPhotoPaths', JSON.stringify(existingPhotoPaths));

    try {
      let response;
      if (isEditMode) {
        formData.append('customerId', customer!.id);
        response = await fetch('/api/customers', {
          method: 'PUT',
          body: formData,
        });
      } else {
        response = await fetch('/api/customers', {
          method: 'POST',
          body: formData,
        });
      }

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!');
        onOpenChange(false);
      } else {
        const errorMessage = result.error || 'An unknown error occurred.';
        toast.error(errorMessage);
        console.error('API Error:', result.details);
      }
    } catch (error) {
      toast.error('A network error occurred. Please try again.');
      console.error('Fetch Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newPhotoFiles = Array.from(files).map(file => ({
        file,
        url: URL.createObjectURL(file)
      }));
      setNewPhotos(prev => [...prev, ...newPhotoFiles]);
    }
    event.target.value = '';
  };

  const removeNewPhoto = (indexToRemove: number) => {
    setNewPhotos(prev => {
      const urlToRevoke = prev[indexToRemove].url;
      URL.revokeObjectURL(urlToRevoke);
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const removeExistingPhoto = (indexToRemove: number) => {
    setExistingPhotos(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update the details for this customer.'
              : 'Enter the details of the new customer. All fields marked with * are required.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Full Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Phone Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="+91XXXXXXXXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="customer@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="id_type"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>ID Type *</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {idTypes.map(type => (
                        <SelectItem key={type} value={type} className="capitalize">
                          {type.replace('_', ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="id_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID Number *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ID number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="md:col-span-2">
              <FormLabel>ID Photos</FormLabel>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {isFetchingUrls && existingPhotos.length === 0 && <p>Loading photos...</p>}
                {existingPhotos.map((photo, index) => (
                  <div key={photo.path} className="relative group">
                    <img src={photo.url} alt={`ID Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeExistingPhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                {newPhotos.map((photo, index) => (
                  <div key={photo.url} className="relative group">
                    <img src={photo.url} alt={`New ID Photo ${index + 1}`} className="w-full h-32 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => removeNewPhoto(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove new photo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
                <label htmlFor="id-photos-input" className="cursor-pointer w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50">
                  <Upload size={32} />
                  <span>Add Photos</span>
                  <input
                    id="id-photos-input"
                    type="file"
                    multiple
                    accept="image/*"
                    className="sr-only"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>

            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Address Line 1 *</FormLabel>
                  <FormControl>
                    <Input placeholder="House no, Street name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Mumbai" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Maharashtra" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pin_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>PIN Code *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. 400001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any special notes about the customer..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="md:col-span-2">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  isEditMode ? 'Save Changes' : 'Add Customer'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 