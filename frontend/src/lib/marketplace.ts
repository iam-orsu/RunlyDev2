// ─── Marketplace CDN Library Definitions ──────────────────────

export type LibraryCategory = 'css-framework' | 'ui-components' | 'js-library' | 'fonts' | 'icons';

export interface MarketplaceLibrary {
  id: string;
  name: string;
  category: LibraryCategory;
  description: string;
  inject: string;
  requires?: string[];
  warning?: string;
  size?: string;
}

export const MARKETPLACE_LIBRARIES: MarketplaceLibrary[] = [
  // ─── CSS Frameworks ─────────────────────────────────────────
  {
    id: 'tailwind',
    name: 'Tailwind CSS v4',
    category: 'css-framework',
    description: 'Utility-first CSS framework',
    inject: `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`,
    size: '~200KB',
  },
  {
    id: 'bootstrap',
    name: 'Bootstrap 5',
    category: 'css-framework',
    description: 'Popular responsive framework',
    inject: `<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">\n<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>`,
    size: '~65KB',
  },
  {
    id: 'bulma',
    name: 'Bulma',
    category: 'css-framework',
    description: 'Modern CSS-only framework',
    inject: `<link href="https://cdn.jsdelivr.net/npm/bulma@1.0.2/css/bulma.min.css" rel="stylesheet">`,
    size: '~25KB',
  },
  {
    id: 'mdl',
    name: 'Material Design Lite',
    category: 'css-framework',
    description: 'Google Material Design',
    inject: `<link href="https://code.getmdl.io/1.3.0/material.indigo-pink.min.css" rel="stylesheet">\n<script defer src="https://code.getmdl.io/1.3.0/material.min.js"></script>`,
    size: '~50KB',
  },

  // ─── UI Components ──────────────────────────────────────────
  {
    id: 'daisyui',
    name: 'DaisyUI 5',
    category: 'ui-components',
    description: 'Tailwind component library',
    inject: `<link href="https://cdn.jsdelivr.net/npm/daisyui@5" rel="stylesheet" type="text/css">`,
    requires: ['tailwind'],
    warning: 'Requires Tailwind CSS to be selected',
    size: '~40KB',
  },
  {
    id: 'flowbite',
    name: 'Flowbite',
    category: 'ui-components',
    description: 'Tailwind UI components',
    inject: `<link href="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.css" rel="stylesheet">\n<script src="https://cdn.jsdelivr.net/npm/flowbite@2.5.2/dist/flowbite.min.js"></script>`,
    requires: ['tailwind'],
    warning: 'Requires Tailwind CSS to be selected',
    size: '~45KB',
  },

  // ─── JS Libraries ──────────────────────────────────────────
  {
    id: 'jquery',
    name: 'jQuery 3',
    category: 'js-library',
    description: 'DOM manipulation library',
    inject: `<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>`,
    size: '~30KB',
  },
  {
    id: 'lodash',
    name: 'Lodash',
    category: 'js-library',
    description: 'Utility functions',
    inject: `<script src="https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"></script>`,
    size: '~25KB',
  },
  {
    id: 'axios',
    name: 'Axios',
    category: 'js-library',
    description: 'HTTP client',
    inject: `<script src="https://cdn.jsdelivr.net/npm/axios@1.7.9/dist/axios.min.js"></script>`,
    size: '~14KB',
  },
  {
    id: 'chartjs',
    name: 'Chart.js',
    category: 'js-library',
    description: 'Canvas chart library',
    inject: `<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>`,
    size: '~65KB',
  },
  {
    id: 'threejs',
    name: 'Three.js',
    category: 'js-library',
    description: '3D graphics library',
    inject: `<script src="https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.min.js"></script>`,
    size: '~160KB',
  },
  {
    id: 'gsap',
    name: 'GSAP',
    category: 'js-library',
    description: 'Animation platform',
    inject: `<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>`,
    size: '~25KB',
  },

  // ─── Fonts ──────────────────────────────────────────────────
  {
    id: 'font-inter',
    name: 'Inter',
    category: 'fonts',
    description: 'Clean sans-serif font',
    inject: `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">`,
  },
  {
    id: 'font-poppins',
    name: 'Poppins',
    category: 'fonts',
    description: 'Geometric sans-serif',
    inject: `<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">`,
  },
  {
    id: 'font-jetbrains',
    name: 'JetBrains Mono',
    category: 'fonts',
    description: 'Developer monospace font',
    inject: `<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">`,
  },
  {
    id: 'font-roboto',
    name: 'Roboto',
    category: 'fonts',
    description: 'Google default font',
    inject: `<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">`,
  },

  // ─── Icons ──────────────────────────────────────────────────
  {
    id: 'fontawesome',
    name: 'Font Awesome 6',
    category: 'icons',
    description: 'Icon library (2000+ icons)',
    inject: `<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" rel="stylesheet">`,
    size: '~80KB',
  },
  {
    id: 'lucide',
    name: 'Lucide Icons',
    category: 'icons',
    description: 'Clean SVG icons',
    inject: `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>`,
    size: '~50KB',
  },
  {
    id: 'heroicons',
    name: 'Heroicons',
    category: 'icons',
    description: 'Tailwind team icons',
    inject: `<script src="https://unpkg.com/heroicons@2.1.5/dist/heroicons.js"></script>`,
    size: '~30KB',
  },
];

// ─── Helpers ──────────────────────────────────────────────────

const CATEGORY_LABELS: Record<LibraryCategory, string> = {
  'css-framework': 'CSS Frameworks',
  'ui-components': 'UI Components',
  'js-library': 'JS Libraries',
  'fonts': 'Fonts',
  'icons': 'Icons',
};

export function getCategoryLabel(category: LibraryCategory): string {
  return CATEGORY_LABELS[category] || category;
}

export function getSelectedLibraries(ids: string[]): MarketplaceLibrary[] {
  return MARKETPLACE_LIBRARIES.filter(l => ids.includes(l.id));
}

export function getLibraryById(id: string): MarketplaceLibrary | undefined {
  return MARKETPLACE_LIBRARIES.find(l => l.id === id);
}

/**
 * Build the HTML injection string for all selected libraries.
 * Order: Fonts → DaisyUI (before Tailwind) → CSS Frameworks → UI Components → JS Libraries → Icons
 */
export function buildLibraryInjections(selectedIds: string[]): string {
  if (selectedIds.length === 0) return '';

  const libs = MARKETPLACE_LIBRARIES.filter(l => selectedIds.includes(l.id));

  // Careful ordering: DaisyUI/Flowbite CSS link BEFORE Tailwind script
  const sorted = [
    ...libs.filter(l => l.category === 'fonts'),
    ...libs.filter(l => l.id === 'daisyui'),
    ...libs.filter(l => l.id === 'flowbite'),
    ...libs.filter(l => l.category === 'css-framework' && l.id !== 'tailwind'),
    ...libs.filter(l => l.id === 'tailwind'),
    ...libs.filter(l => l.category === 'ui-components' && l.id !== 'daisyui' && l.id !== 'flowbite'),
    ...libs.filter(l => l.category === 'js-library'),
    ...libs.filter(l => l.category === 'icons'),
  ];

  // Deduplicate (a lib might match multiple filters)
  const seen = new Set<string>();
  const unique = sorted.filter(l => {
    if (seen.has(l.id)) return false;
    seen.add(l.id);
    return true;
  });

  return unique.map(l => l.inject).join('\n');
}

/** FOUC fix — only needed when Tailwind is selected */
export const FOUC_FIX = `<style>body{visibility:hidden}</style>
<script>
  requestAnimationFrame(()=>requestAnimationFrame(()=>{document.body.style.visibility='visible'}));
  setTimeout(()=>{document.body.style.visibility='visible'},3000);
</script>`;

export function needsFoucFix(selectedIds: string[]): boolean {
  return selectedIds.includes('tailwind');
}

/** Returns category order for display in the dropdown */
export const CATEGORY_ORDER: LibraryCategory[] = [
  'css-framework',
  'ui-components',
  'js-library',
  'fonts',
  'icons',
];

export function getLibrariesByCategory(): { category: LibraryCategory; label: string; libs: MarketplaceLibrary[] }[] {
  return CATEGORY_ORDER.map(cat => ({
    category: cat,
    label: getCategoryLabel(cat),
    libs: MARKETPLACE_LIBRARIES.filter(l => l.category === cat),
  }));
}
