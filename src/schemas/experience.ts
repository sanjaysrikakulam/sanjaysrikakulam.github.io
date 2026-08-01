import { z } from 'zod';
import { commonFlags } from './common';

const yearMonth = z.string().regex(/^\d{4}-\d{2}$/, 'Use YYYY-MM, for example 2025-09');

export const experienceSchema = z
  .object({
    title: z.string().min(1),
    org: z.string().min(1),
    org_url: z.url().optional(),
    location: z.string().optional(),
    start: yearMonth,
    end: yearMonth.nullable(),
    track_colour: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/)
      .optional(),
    summary: z.string().min(1),
    highlights: z.array(z.string().min(1)).min(1, 'A role needs at least one highlight'),
    details: z.array(z.string().min(1)).default([]),
    affiliations: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    ...commonFlags,
  })
  .strict();

export type Experience = z.infer<typeof experienceSchema>;
