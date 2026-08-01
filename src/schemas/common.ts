import { z } from 'zod';

/**
 * Flags every content item carries. Omitting a flag means the item is shown
 * and not promoted, so a flag only ever appears in the data to hide or
 * promote something.
 */
export const commonFlags = {
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  in_pdf: z.boolean().optional(),
  order: z.number().optional(),
};
