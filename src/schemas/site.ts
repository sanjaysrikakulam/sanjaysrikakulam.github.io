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
        email: z.email().optional(),
        // Contact facts used by the /c/* card routes and the vCard download.
        // All optional so the site renders unchanged when they are absent.
        prefix: z.string().optional(),
        title: z.string().optional(),
        org: z.string().optional(),
        // Optional prefilled subject/body for the /c hub mailto. Absent means the
        // mail client opens with just the address, as before.
        email_subject: z.string().optional(),
        email_body: z.string().optional(),
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
        z
          .object({
            value: z.string().optional(),
            metric: z.string().optional(),
            label: z.string(),
            source: z.string().optional(),
            suffix: z.string().optional(),
          })
          .strict()
          .refine((entry) => Boolean(entry.metric ?? entry.value), {
            message: 'A proof entry needs a metric, a literal value, or both',
            path: ['metric'],
          }),
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
    analytics: z
      .object({
        umami: z
          .object({
            script_url: z.url(),
            website_id: z.uuid(),
            // Hostnames the tracker is allowed to run on, rendered as
            // data-domains. Empty means "run anywhere", which also counts
            // `astro dev` and the CI PDF render.
            domains: z.array(z.string().min(1)).default([]),
          })
          .strict()
          .optional(),
      })
      .strict()
      // prefault (not default) so an absent analytics block is still parsed
      // through the schema; with no umami block the feature stays off.
      .prefault({}),
  })
  .strict()
  .refine((site) => site.profile.headline.includes(site.profile.headline_accent), {
    message: 'headline_accent must be a substring of headline so it can be styled in place',
    path: ['profile', 'headline_accent'],
  });

export type Site = z.infer<typeof siteSchema>;
