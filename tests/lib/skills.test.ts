import { describe, expect, it } from 'vitest';
import { skillTabs } from '../../src/lib/skills';

const group = (category: 'research' | 'infrastructure') => ({
  group: 'G',
  items: ['x'],
  category,
  visible: true,
  featured: false,
});

describe('skillTabs', () => {
  it('lists research before infrastructure regardless of group order', () => {
    const { tabs } = skillTabs([group('infrastructure'), group('research')]);
    expect(tabs.map((tab) => tab.id)).toEqual(['research', 'infrastructure']);
  });

  it('labels each tab', () => {
    const { tabs } = skillTabs([group('research'), group('infrastructure')]);
    expect(tabs).toEqual([
      { id: 'research', label: 'Research and AI' },
      { id: 'infrastructure', label: 'Infrastructure and operations' },
    ]);
  });

  it('shows tabs only when more than one category is present', () => {
    expect(skillTabs([group('research'), group('infrastructure')]).showTabs).toBe(true);
    expect(skillTabs([group('research'), group('research')]).showTabs).toBe(false);
  });

  it('omits a category that no group uses', () => {
    const { tabs } = skillTabs([group('infrastructure')]);
    expect(tabs.map((tab) => tab.id)).toEqual(['infrastructure']);
  });
});
