import { z } from 'zod';
import { commonFlags } from './common';

export const educationSchema = z
  .object({
    degree: z.string().min(1),
    year: z.number().int().min(1900).max(2100),
    institution: z.string().min(1),
    location: z.string().optional(),
    thesis: z
      .object({ title: z.string().min(1), url: z.url().optional() })
      .strict()
      .optional(),
    ...commonFlags,
  })
  .strict();

export type Education = z.infer<typeof educationSchema>;
