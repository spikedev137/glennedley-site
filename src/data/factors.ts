export const factors = [
  {
    slug: 'belief',
    name: 'Belief',
    short: 'What do you expect for yourself?',
    description: 'Belief shapes your self-image, your expectations and what you consider possible. It is the story underneath the choices you make.',
  },
  {
    slug: 'programming-the-mind',
    name: 'Programming the Mind',
    short: 'What are you repeatedly telling yourself?',
    description: 'The words, ideas and habits you repeat become familiar pathways. Deliberate inputs help you replace unhelpful patterns with useful ones.',
  },
  {
    slug: 'mental-posture',
    name: 'Mental Posture',
    short: 'What will you accept or reject mentally?',
    description: 'Mental posture is how you choose to meet events you cannot control. It includes perspective, resilience and the response you practise.',
  },
  {
    slug: 'focus',
    name: 'Focus',
    short: 'Where are you directing your attention?',
    description: 'What you concentrate on grows in importance and influences your next action. Focus turns priorities into consistent progress.',
  },
] as const;

export type FactorSlug = typeof factors[number]['slug'];

export const factorBySlug = Object.fromEntries(
  factors.map((factor) => [factor.slug, factor]),
) as Record<FactorSlug, typeof factors[number]>;
