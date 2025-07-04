'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import imageCompression from 'browser-image-compression';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { addCustomer, updateCustomer, getSignedUrls } from '@/app/(dashboard)/customers/actions';
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
  id_photos: z.array(z.instanceof(File)).optional(),
  address_line1: z.string().min(5, 'Address is required.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  pin_code: z.string().regex(/^[1-9][0-9]{5}$/, 'Invalid Indian PIN code.'),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;
type Customer = Database['public']['Tables']['customers']['Row'];

interface AddCustomerFormBookingProps {
  customer?: Customer;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: (customer: Customer) => void;
}

export function AddCustomerFormBooking({ customer, isOpen, onOpenChange, onSuccess }: AddCustomerFormBookingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = customer !== undefined;

  const [existingPhotos, setExistingPhotos] = useState<{path: string, url: string}[]>([]);
  const [newPhotos, setNewPhotos] = useState<{file: File, url: string}[]>([]);
  
  const [, startUrlTransition] = useTransition();

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
          id_photos: [],
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
      toast.info(`Compressing ${newPhotos.length} image(s)...`);
      for (const photo of newPhotos) {
        try {
          const compressedFile = await imageCompression(photo.file, {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          formData.append('id_photos', compressedFile);
        } catch (error) {
          console.error('Image compression error:', error);
          toast.error(`Failed to compress image: ${photo.file.name}`);
          setIsSubmitting(false);
          return;
        }
      }
    }
    
    const existingPhotoPaths = existingPhotos.map(p => p.path);

    const result = isEditMode
      ? await updateCustomer(customer!.id, existingPhotoPaths, formData)
      : await addCustomer(formData);

    if (result.success) {
      toast.success(isEditMode ? 'Customer updated successfully!' : 'Customer added successfully!');
      onSuccess(result.data);
      onOpenChange(false);
    } else {
      const errorMessage = typeof result.error === 'string' 
        ? result.error 
        : 'An unknown error occurred.';
      toast.error(errorMessage);
    }
    setIsSubmitting(false);
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

  const idTypeOptions = [
    { value: 'aadhaar', label: 'Aadhaar Card' },
    { value: 'pan', label: 'PAN Card' },
    { value: 'passport', label: 'Passport' },
    { value: 'driving_license', label: 'Driving License' },
    { value: 'voter_id', label: 'Voter ID' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Edit Customer' : 'Add New Customer'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update customer information and ID verification documents.'
              : 'Enter customer details and upload ID verification documents.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
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
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="+91XXXXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Enter email address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* ID Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">ID Verification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="id_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select ID type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {idTypeOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
              </div>

              {/* Photo Upload */}
              <div className="space-y-2">
                <FormLabel>ID Photos</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="photo-upload" className="cursor-pointer">
                        <span className="mt-2 block text-sm font-medium text-gray-900">
                          Upload ID photos
                        </span>
                        <span className="mt-1 block text-sm text-gray-600">
                          PNG, JPG up to 10MB each
                        </span>
                      </label>
                      <input
                        id="photo-upload"
                        type="file"
                        className="hidden"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Existing Photos */}
                {existingPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Current Photos:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {existingPhotos.map((photo, index) => (
                        <div key={index} className="relative w-28 h-28">
                          <Image
                            src={photo.url}
                            alt={`ID Photo ${index + 1}`}
                            fill
                            className="object-cover w-full h-full rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeExistingPhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Photos */}
                {newPhotos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">New Photos:</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {newPhotos.map((photo, index) => (
                        <div key={index} className="relative w-28 h-28">
                          <Image
                            src={photo.url}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover w-full h-full rounded"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-1 right-1 h-6 w-6 p-0"
                            onClick={() => removeNewPhoto(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Address Information</h3>
              
              <FormField
                control={form.control}
                name="address_line1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter complete address" 
                        className="min-h-[80px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter city" {...field} />
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
                        <Input placeholder="Enter state" {...field} />
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
                        <Input placeholder="Enter PIN code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any additional notes about the customer" 
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Update Customer' : 'Add Customer'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 