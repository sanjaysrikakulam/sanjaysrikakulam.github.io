import { z } from 'zod';

const sectionSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().optional(),
    description: z.string().optional(),
    visible: z.boolean().default(true),
    subsections: z
      .array(
        z
          .object({
            id: z.string().min(1),
            title: z.string().optional(),
            description: z.string().optional(),
            visible: z.boolean().default(true),
          })
          .strict(),
      )
      .default([]),
  })
  .strict();

export const siteSchema = z
  .object({
    profile: z
      .object({
        name: z.string().min(1),
        headline: z.string().min(1),
        headline_accent: z.string().min(1),
        location: z.string().min(1),
        email: z.email(),
        avatar: z.string().default('/avatar.jpg'),
        bio: z.string().optional(),
        available: z.boolean().default(true),
        available_text: z.string().default('Open to collaboration and opportunities'),
      })
      .strict(),
    links: z.record(z.string(), z.url()),
    sections: z.array(sectionSchema).min(1),
    display: z
      .object({
        photo: z.boolean().default(true),
        proof_strip: z.boolean().default(true),
        theme_toggle: z.boolean().default(true),
        grid_includes_featured: z.boolean().default(true),
        open_source: z
          .object({
            carousel: z.boolean().default(true),
            per_view: z.number().int().min(1).max(6).default(3),
            autoplay: z.boolean().default(true),
            autoplay_interval: z.number().int().min(2000).default(5000),
          })
          .strict()
          // prefault (not default) so an absent open_source block is still
          // parsed through the schema, filling in per_view, autoplay, etc.
          .prefault({}),
      })
      .strict()
      .prefault({}),
    proof: z
      .array(
        z.object({ value: z.string(), label: z.string(), source: z.string().optional() }).strict(),
      )
      .default([]),
    pdf: z
      .object({
        page_size: z.enum(['A4', 'Letter']).default('A4'),
        sections: z.array(z.string()).default([]),
        max_items: z.record(z.string(), z.number().int().positive()).default({}),
      })
      .strict()
      .prefault({}),
  })
  .strict()
  .refine((site) => site.profile.headline.includes(site.profile.headline_accent), {
    message: 'headline_accent must be a substring of headline so it can be styled in place',
    path: ['profile', 'headline_accent'],
  });

export type Site = z.infer<typeof siteSchema>;
