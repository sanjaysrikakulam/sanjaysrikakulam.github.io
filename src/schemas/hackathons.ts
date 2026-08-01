import { z } from 'zod';
import { commonFlags } from './common';

export const hackathonSchema = z
  .object({
    name: z.string().min(1),
    year: z.number().int().min(1990).max(2100),
    location: z.string().optional(),
    led: z.boolean().default(false),
    summary: z.string().optional(),
    url: z.url().optional(),
    ...commonFlags,
  })
  .strict();

export type Hackathon = z.infer<typeof hackathonSchema>;
