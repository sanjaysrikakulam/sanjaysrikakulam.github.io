import type { SkillGroup } from '../schemas/skills';

export type SkillCategory = SkillGroup['category'];

const CATEGORY_LABELS: Record<SkillCategory, string> = {
  research: 'Research and AI',
  infrastructure: 'Infrastructure and operations',
};

// Research leads so a reader meets the AI and bioinformatics work before the
// operations stack, whatever order the groups sit in the data file.
const CATEGORY_ORDER: SkillCategory[] = ['research', 'infrastructure'];

export function skillTabs(groups: SkillGroup[]) {
  const present = new Set(groups.map((group) => group.category));
  const tabs = CATEGORY_ORDER.filter((id) => present.has(id)).map((id) => ({
    id,
    label: CATEGORY_LABELS[id],
  }));
  return { tabs, showTabs: tabs.length > 1 };
}
