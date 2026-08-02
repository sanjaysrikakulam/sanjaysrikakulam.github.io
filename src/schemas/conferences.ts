import { z } from 'zod';
import { commonFlags } from './common';

export const conferenceSchema = z
  .object({
    name: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    location: z.string().optional(),
    role: z.enum(['talk', 'poster', 'workshop', 'exhibition', 'attended', 'panel']),
    title: z.string().optional(),
    award: z.string().optional(),
    url: z.url().optional(),
    zenodo_doi: z
      .string()
      .regex(/^10\.\d{4,9}\//)
      .optional(),
    materials: z.url().optional(),
    ...commonFlags,
  })
  .strict();

export type Conference = z.infer<typeof conferenceSchema>;
