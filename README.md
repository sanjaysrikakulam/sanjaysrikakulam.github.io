# sanjaysrikakulam.github.io

Source for my personal site. Built with Astro, deployed to GitHub Pages.

## Updating content

All content is in `data/`. Edit the relevant file and push to `main`. The site rebuilds and
deploys in about two minutes. Nothing outside `data/` needs to change to add or edit content.

| File               | Holds                                                                 |
| ------------------ | --------------------------------------------------------------------- |
| `site.yml`         | Name, contact links, section order, section headings, display options |
| `education.yml`    | Degrees                                                               |
| `experience.yml`   | Roles                                                                 |
| `projects.yml`     | Software, with the repository each one lives in                       |
| `publications.yml` | Papers, preprints, deliverables, posters, and talks                   |
| `conferences.yml`  | Talks, posters, workshops, and events attended                        |
| `hackathons.yml`   | Hackathons                                                            |
| `skills.yml`       | Skill groups                                                          |

Each file starts with a `$schema` comment. In VS Code with the YAML extension installed, that
gives autocomplete, hover documentation, and inline errors as you type.

### Showing and hiding

Every entry supports three flags. Leave a flag out and the entry is shown and not promoted.

```yaml
- name: Example
  visible: false # hide it from the site, keep the record in the file
  featured: true # promote it into the highlighted block
  in_pdf: false # keep it on the site but out of the PDF
```

Section order comes from the `sections` list in `site.yml`. Move a line to move a section.

Entries hidden with `visible: false` stay in this public repository and remain readable. The flag
controls presentation, not privacy.

## Numbers

No figure is typed by hand. Stars and forks come from the GitHub API, citation counts from
OpenAlex, and download counts from Zenodo. All three are read when the site builds and cached in
`data/.cache/`. If an API is unavailable the build uses the cached values and logs a warning, so a
deploy never fails because a third party is down.

A scheduled run every Monday refreshes the figures without any manual step.

## The PDF

`public/Sanjay_Srikakulam_CV.pdf` is generated from the same data as the site, so the two cannot
drift. Which sections it contains, in what order, and how many items each may hold are set in the
`pdf` block of `site.yml`. Any entry can be excluded with `in_pdf: false`.

## Running locally

```bash
npm install
npm run fetch     # refresh cached figures, optional
npm run dev       # http://localhost:4321
```

## Checks

```bash
npm run lint      # ESLint and Prettier
npm run check     # Astro and TypeScript
npm test          # unit tests
npm run test:e2e  # browser tests, needs npx playwright install chromium
npm run build
npm run pdf       # regenerate the CV, needs a build first
```

CI runs all of these on every push, along with `npm audit`.

### First deploy on a new repository

Before the workflow can publish anything, GitHub Pages has to be pointed at Actions as its
source: repository Settings, Pages, and under "Build and deployment" choose "GitHub Actions"
instead of the default "Deploy from a branch". This is a one-time step; the workflow can enable
Pages itself on the very first run, but only once it has permission to, so doing it by hand up
front avoids depending on that.

## Licence

Code is MIT licensed. The content under `data/`, and the text and images of the site, are not
covered by that licence and remain my own.
