import { z } from 'zod';

/**
 * Flags every content item carries. Omitting a flag means the item is shown
 * and not promoted, so a flag only ever appears in the data to hide or
 * promote something.
 *
 * id is not authored in the YAML; Astro's file loader derives it (see
 * src/lib/slug.ts) and folds it into the same object it then validates, so
 * every collection schema needs to tolerate it even though nothing in the
 * data files sets it.
 */
export const commonFlags = {
  id: z.string().optional(),
  visible: z.boolean().default(true),
  featured: z.boolean().default(false),
  in_pdf: z.boolean().optional(),
  order: z.number().optional(),
};
