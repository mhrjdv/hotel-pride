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
import { UserPlus, Loader2, Upload, X, Edit } from 'lucide-react';
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

interface AddCustomerFormProps {
  customer?: Customer;
}

export function AddCustomerForm({ customer }: AddCustomerFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // State for photo previews
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
    const isEditing = customer !== undefined;
    setIsEditMode(isEditing);

    if (isEditing && customer) {
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
        id_photos: [], // Reset file input
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
      setNewPhotos([]); // Clear any new photos when switching to edit
    } else {
      // Reset everything when opening for a new customer
      form.reset();
      setExistingPhotos([]);
      setNewPhotos([]);
    }
  }, [customer, isOpen, form]);

  const onSubmit = async (data: CustomerFormValues) => {
    setIsSubmitting(true);
    toast.info(isEditMode ? 'Updating customer...' : 'Adding new customer...');

    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key !== 'id_photos' && value) {
        formData.append(key, value as string);
      }
    });

    // Handle new photo uploads
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
      if (!isEditMode) {
        form.reset();
        setNewPhotos([]);
      }
      setIsOpen(false);
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
    // Reset file input
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
    <>
      {isEditMode ? (
        <Button variant="outline" onClick={() => setIsOpen(true)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Customer
        </Button>
      ) : (
        <Button onClick={() => setIsOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Personal Details */}
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

              {/* ID Details */}
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
                        {idTypes.map((type) => (
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
                  <FormItem className="md:col-span-1">
                    <FormLabel>ID Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="id_photos"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>ID Photo(s)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-4">
                        <Button type="button" variant="outline" asChild>
                           <label htmlFor="id_photo_upload" className="cursor-pointer flex items-center">
                             <Upload className="mr-2 h-4 w-4" />
                             Upload Photo(s)
                           </label>
                        </Button>
                        <Input id="id_photo_upload" type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
                        {/* Image Previews */}
                        {(existingPhotos.length > 0 || newPhotos.length > 0) && (
                          <div className="mt-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                            {existingPhotos.map((photo, index) => (
                              <div key={photo.path} className="relative group">
                                <img src={photo.url} alt={`Existing photo ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeExistingPhoto(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            {newPhotos.map((photo, index) => (
                              <div key={photo.url} className="relative group">
                                <img src={photo.url} alt={`New photo ${index + 1}`} className="w-full h-24 object-cover rounded-md border" />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => removeNewPhoto(index)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Address Details */}
              <FormField
                control={form.control}
                name="address_line1"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="House no, street, area" {...field} />
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
                      <Input placeholder="e.g., Mumbai" {...field} />
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
                      <Input placeholder="e.g., Maharashtra" {...field} />
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
                      <Input placeholder="e.g., 400001" {...field} />
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
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Update Customer' : 'Add Customer'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
} 