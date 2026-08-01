import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { yamlArrayParser } from './lib/slug';
import { educationSchema } from './schemas/education';
import { experienceSchema } from './schemas/experience';
import { projectSchema } from './schemas/projects';
import { publicationSchema } from './schemas/publications';
import { conferenceSchema } from './schemas/conferences';
import { hackathonSchema } from './schemas/hackathons';
import { skillGroupSchema } from './schemas/skills';

const education = defineCollection({
  loader: file('data/education.yml', {
    parser: yamlArrayParser((entry) => `${entry.degree}-${entry.year}`),
  }),
  schema: educationSchema,
});

const experience = defineCollection({
  loader: file('data/experience.yml', {
    parser: yamlArrayParser((entry) => `${entry.org}-${entry.start}`),
  }),
  schema: experienceSchema,
});

const projects = defineCollection({
  loader: file('data/projects.yml', {
    parser: yamlArrayParser((entry) => String(entry.name)),
  }),
  schema: projectSchema,
});

const publications = defineCollection({
  loader: file('data/publications.yml', {
    parser: yamlArrayParser((entry) => `${entry.title}-${entry.year}`),
  }),
  schema: publicationSchema,
});

const conferences = defineCollection({
  loader: file('data/conferences.yml', {
    parser: yamlArrayParser((entry) => `${entry.name}-${entry.year}-${entry.role}`),
  }),
  schema: conferenceSchema,
});

const hackathons = defineCollection({
  loader: file('data/hackathons.yml', {
    parser: yamlArrayParser((entry) => `${entry.name}-${entry.year}`),
  }),
  schema: hackathonSchema,
});

const skills = defineCollection({
  loader: file('data/skills.yml', {
    parser: yamlArrayParser((entry) => String(entry.group)),
  }),
  schema: skillGroupSchema,
});

export const collections = {
  education,
  experience,
  projects,
  publications,
  conferences,
  hackathons,
  skills,
};
