/**
 * Illustration templates — one template per illustration type, each with a few
 * variants. Everything here is plain text: no AI service, no network call.
 *
 *  - `focus`      what this type of picture is good at
 *  - `variants`   different ways to arrange the same content, which is what the
 *                 🔄 Regenerate button walks through
 *  - `sections()` the type-specific part of the prompt (the builder adds the
 *                 topic details, the design rules and the closing lines)
 */
export const ILLUSTRATION_TEMPLATES = [
  {
    value: 'concept_diagram',
    label: 'Concept Diagram',
    labelBn: 'Concept Diagram — অংশগুলো কীভাবে সম্পর্কিত',
    focus: 'how the parts of the concept relate to each other',
    variants: [
      {
        id: 'balanced',
        layout: 'a balanced layout with the main parts around the central concept and clear connecting arrows',
      },
      {
        id: 'left-to-right',
        layout: 'a left-to-right arrangement where the relationship arrows read like a sentence',
      },
      {
        id: 'grouped',
        layout: 'grouped clusters, where closely related parts sit inside one light box and arrows connect the boxes',
      },
    ],
    sections: ({ components, relationships }) => [
      {
        heading: 'Show these parts (each one clearly labelled):',
        lines: components,
      },
      {
        heading: 'Make these relationships visible with arrows:',
        lines: relationships,
      },
    ],
  },
  {
    value: 'process_flow',
    label: 'Process Flow',
    labelBn: 'Process Flow — ধাপে ধাপে কী ঘটে',
    focus: 'the step-by-step order in which things happen',
    variants: [
      {
        id: 'linear',
        layout: 'a straight vertical flow, each step in its own box, joined by downward arrows',
      },
      {
        id: 'numbered',
        layout: 'numbered steps (1, 2, 3) connected by arrows, arranged left to right in two rows if needed',
      },
      {
        id: 'cycle',
        layout: 'a circular flow with arrows going clockwise, returning to the first step to show that it repeats',
      },
    ],
    sections: ({ flow, components }) => [
      {
        heading: 'Show the process in exactly this order:',
        lines: flow,
      },
      {
        heading: 'Elements involved in the process:',
        lines: components.slice(0, 4),
      },
      {
        heading: 'Arrow rules:',
        lines: [
          'Draw one clear arrow from each step to the next step',
          'Arrow direction must follow the real order — never reverse it',
          'Keep every arrow short and unobstructed',
        ],
      },
    ],
  },
  {
    value: 'architecture_diagram',
    label: 'Architecture Diagram',
    labelBn: 'Architecture Diagram — স্তর ও ব্লক',
    focus: 'which layers and blocks the system is built from, and what talks to what',
    variants: [
      {
        id: 'layered',
        layout: 'stacked horizontal layers (one block per layer) with vertical arrows showing data moving between layers',
      },
      {
        id: 'blocks',
        layout: 'a system block diagram: large labelled blocks connected by straight arrows, grouped by role',
      },
      {
        id: 'deployment',
        layout: 'a deployment-style diagram that separates what is local (device / edge) from what is remote (network / cloud / user)',
      },
    ],
    sections: ({ components, flow }) => [
      {
        heading: 'Show these building blocks, each inside its own labelled box:',
        lines: components,
      },
      {
        heading: 'Show how data or control moves through the system:',
        lines: flow.slice(0, 5),
      },
      {
        heading: 'Structure rules:',
        lines: [
          'Group blocks that belong together and keep clear space between groups',
          'Only connect blocks that really interact',
          'The overall flow should read naturally (for example bottom-to-top or left-to-right)',
        ],
      },
    ],
  },
  {
    value: 'educational_illustration',
    label: 'Educational Illustration',
    labelBn: 'Educational Illustration — সহজ করে বোঝানো ছবি',
    focus: 'making the concept feel familiar by putting it in a simple, realistic scene',
    variants: [
      {
        id: 'real-world',
        layout: 'a simple real-world scene (devices, screens, cables) with short English labels pointing at the real objects',
      },
      {
        id: 'split-view',
        layout: 'a split view: the real-world scene on one side, the matching block diagram on the other, with matching labels',
      },
      {
        id: 'callouts',
        layout: 'one clean central illustration with 3-5 numbered callouts around it explaining the parts',
      },
    ],
    sections: ({ components, summary }) => [
      {
        heading: 'Illustrate this idea:',
        lines: [summary],
      },
      {
        heading: 'Show these parts recognisably and label them:',
        lines: components,
      },
      {
        heading: 'Illustration rules:',
        lines: [
          'Use simple, realistic objects that a student would recognise (devices, connection lines, screens)',
          'Keep the scene calm and uncluttered — no more than five labelled objects',
          'The picture must teach the concept, not decorate the page',
        ],
      },
    ],
  },
  {
    value: 'concept_visualization',
    label: 'Concept Visualization',
    labelBn: 'Concept Visualization — কঠিন ভাবনাকে ছবিতে',
    focus: 'turning an abstract idea into something you can see, by contrasting what happens with and without it',
    variants: [
      {
        id: 'before-after',
        layout: 'a before/after comparison: the situation without this concept on the left, with it on the right',
      },
      {
        id: 'metaphor',
        layout: 'a single simple visual metaphor (for example a post office, a road map or a filing cabinet) that matches the concept truthfully',
      },
      {
        id: 'zoom',
        layout: 'a zoom-in story: the whole picture on one side, one important part enlarged and explained on the other',
      },
    ],
    sections: ({ components, summary, relationships }) => [
      {
        heading: 'Visualise this idea:',
        lines: [summary],
      },
      {
        heading: 'The visual should make these points obvious without long text:',
        lines: relationships,
      },
      {
        heading: 'Elements to include:',
        lines: components.slice(0, 4),
      },
      {
        heading: 'Rules for abstraction:',
        lines: [
          'The metaphor must stay technically truthful — never replace a real component with a misleading object',
          'Prefer few large elements over many small details',
          'Use colour only to separate the ideas, not for decoration',
        ],
      },
    ],
  },
];

export const ILLUSTRATION_TYPES = ILLUSTRATION_TEMPLATES.map(({ value, label, labelBn }) => ({
  value,
  label,
  labelBn,
}));

export const DEFAULT_ILLUSTRATION_TYPE = 'educational_illustration';

export const findTemplate = (value) =>
  ILLUSTRATION_TEMPLATES.find((template) => template.value === value) ?? null;

/** value of the next illustration type — used to suggest one after Regenerate. */
export function nextIllustrationType(value) {
  const index = ILLUSTRATION_TEMPLATES.findIndex((template) => template.value === value);
  return ILLUSTRATION_TEMPLATES[(index + 1) % ILLUSTRATION_TEMPLATES.length].value;
}
