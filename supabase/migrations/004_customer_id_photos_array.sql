-- Change customers.id_photo_url to an array to support multiple ID photos
ALTER TABLE public.customers
RENAME COLUMN id_photo_url TO id_photo_urls;

ALTER TABLE public.customers
ALTER COLUMN id_photo_urls TYPE TEXT[] USING ARRAY[id_photo_urls];

COMMENT ON COLUMN public.customers.id_photo_urls IS 'Array of URLs for customer ID photos stored in Supabase Storage.'; 