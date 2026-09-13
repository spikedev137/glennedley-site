import type { FactorSlug } from './factors';

export type MondayMotivator = {
  id: string;
  title: string;
  date: string;
  year: number;
  slug: string;
  oldUrl: string;
  html: string;
  excerpt: string;
  sourceType: string;
  primaryFactor: FactorSlug;
  secondaryFactor?: FactorSlug;
  factorConfidence: 'high' | 'medium' | 'low';
};

const modules = import.meta.glob<{ default: MondayMotivator }>(
  '../entries/mondaymotivator/*.json',
  { eager: true },
);

export const posts = Object.values(modules)
  .map((module) => module.default)
  .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

export const years = [...new Set(posts.map((post) => post.year))].sort((a, b) => b - a);

export function postsForYear(year: number) {
  return posts.filter((post) => post.year === year);
}

export function postsForFactor(factor: FactorSlug) {
  return posts.filter((post) => post.primaryFactor === factor || post.secondaryFactor === factor);
}
