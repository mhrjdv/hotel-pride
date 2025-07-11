-- Migration: Add invoice number generation function
-- Description: Creates a function to generate invoice numbers by type

-- Drop function if exists
DROP FUNCTION IF EXISTS generate_invoice_number_by_type(text);

-- Create function to generate invoice numbers by type
CREATE OR REPLACE FUNCTION generate_invoice_number_by_type(inv_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    prefix text;
    year_part text;
    next_number integer;
    invoice_number text;
BEGIN
    -- Determine prefix based on invoice type
    CASE inv_type
        WHEN 'proforma' THEN prefix := 'PI';
        WHEN 'estimate' THEN prefix := 'EST';
        WHEN 'quote' THEN prefix := 'QUO';
        ELSE prefix := 'INV';
    END CASE;
    
    -- Get current year
    year_part := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    
    -- Get the next number for this type and year
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN invoice_number ~ ('^' || prefix || '-' || year_part || '-[0-9]+$')
                THEN (regexp_match(invoice_number, '^' || prefix || '-' || year_part || '-([0-9]+)$'))[1]::integer
                ELSE 0
            END
        ) + 1, 
        1
    )
    INTO next_number
    FROM invoices
    WHERE invoice_number LIKE prefix || '-' || year_part || '-%';
    
    -- Format the invoice number
    invoice_number := prefix || '-' || year_part || '-' || LPAD(next_number::text, 4, '0');
    
    RETURN invoice_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_invoice_number_by_type(text) TO authenticated;

-- Create a simple wrapper function for backward compatibility
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN generate_invoice_number_by_type('invoice');
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_invoice_number() TO authenticated;

-- Test the function (optional - can be removed in production)
-- SELECT generate_invoice_number_by_type('invoice') as invoice_number;
-- SELECT generate_invoice_number_by_type('proforma') as proforma_number;
-- SELECT generate_invoice_number_by_type('estimate') as estimate_number;
-- SELECT generate_invoice_number_by_type('quote') as quote_number;
