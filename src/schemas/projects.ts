import { z } from 'zod';
import { commonFlags } from './common';

export const projectSchema = z
  .object({
    name: z.string().min(1),
    repo: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, 'Use owner/name, not a full URL')
      .nullable()
      .default(null),
    role: z.string().min(1),
    summary: z.string().min(1),
    tags: z.array(z.string()).default([]),
    paper: z.string().optional(),
    url: z.url().optional(),
    ...commonFlags,
  })
  .strict();

export type Project = z.infer<typeof projectSchema>;
