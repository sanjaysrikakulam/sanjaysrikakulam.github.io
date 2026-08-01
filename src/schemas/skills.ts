import { z } from 'zod';
import { commonFlags } from './common';

export const skillGroupSchema = z
  .object({
    group: z.string().min(1),
    items: z.array(z.string().min(1)).min(1),
    ...commonFlags,
  })
  .strict();

export type SkillGroup = z.infer<typeof skillGroupSchema>;
