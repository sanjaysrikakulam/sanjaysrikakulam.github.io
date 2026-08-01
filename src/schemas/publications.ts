import { z } from 'zod';
import { commonFlags } from './common';

const rawDoi = z
  .string()
  .regex(/^10\.\d{4,9}\//, 'Store the bare DOI without the https://doi.org prefix');

const pubType = z.enum([
  'journal',
  'conference',
  'preprint',
  'deliverable',
  'white-paper',
  'poster',
  'presentation',
  'dataset',
  'software',
]);

export const publicationSchema = z
  .object({
    title: z.string().min(1),
    type: pubType,
    // Extra labels beyond the primary type, e.g. a conference proceeding that
    // was also presented as a poster carries type: conference and tags: [poster].
    tags: z.array(pubType).optional(),
    venue: z.string().optional(),
    year: z.number().int().min(1990).max(2100),
    authors_display: z.string().optional(),
    author_role: z.enum([
      'first',
      'joint-first',
      'corresponding',
      'contributing',
      'consortium',
      'senior',
    ]),
    role_note: z.string().optional(),
    doi: rawDoi.optional(),
    zenodo_doi: rawDoi.optional(),
    project: z.string().optional(),
    slides: z.url().optional(),
    poster: z.url().optional(),
    bibtex: z.boolean().default(true),
    ...commonFlags,
  })
  .strict()
  .refine((entry) => Boolean(entry.doi ?? entry.zenodo_doi), {
    message: 'A publication needs a doi, a zenodo_doi, or both',
    path: ['doi'],
  });

export type Publication = z.infer<typeof publicationSchema>;
