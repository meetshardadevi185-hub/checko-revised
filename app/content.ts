// Site copy in one place. Wording comes from Checko-Homepage-Concepts.html and the approved hero.

export const site = {
  name: 'Checko',
  url: 'https://checko.ai',
  title: 'Checko | Scan it. Know it’s genuine.',
  description:
    'Checko protects products with tactile 3D labels made of randomly set ink. Anyone can verify a product in seconds with a smartphone. Born at IIT Kanpur.',
  tagline: 'The fingerprint of things.',
};

export const nav = [
  { href: '#problem', label: 'The problem' },
  { href: '#solutions', label: 'Solutions' },
  { href: '#industries', label: 'Industries' },
  { href: '#about', label: 'About' },
];

export type Product = { id: string; name: string; category: string; aspect: number; tag: [number, number, number, number] };

// tag: the Checko label's box inside each photo (x, y, w, h as fractions), used to frame the phone camera on it
// v2b: real product photography, each wearing the Checko label
export const products: Product[] = [
  { id: 'v2b-pharma', name: 'Pain relief tablets', category: 'Pharma', aspect: 1.5, tag: [0.6576, 0.166, 0.1758, 0.2832] as [number, number, number, number] },
  { id: 'v2b-apparel', name: 'Premium polo', category: 'Apparel', aspect: 1.5, tag: [0.6413, 0.5615, 0.1107, 0.2051] as [number, number, number, number] },
  { id: 'v2b-lub', name: 'Reserve Select whisky', category: 'Spirits', aspect: 1.5, tag: [0.6999, 0.459, 0.0586, 0.1514] as [number, number, number, number] },
  { id: 'v2b-metal', name: 'Roasted mixed nuts', category: 'Snacks', aspect: 1.5, tag: [0.5632, 0.2051, 0.1335, 0.2979] as [number, number, number, number] },
  { id: 'v2b-shoes', name: 'Masala chips', category: 'Snacks', aspect: 1.5, tag: [0.5859, 0.1904, 0.1204, 0.2979] as [number, number, number, number] },
  { id: 'v2b-elec', name: 'Multigrain atta', category: 'Staples', aspect: 1.5, tag: [0.6641, 0.2197, 0.1172, 0.2881] as [number, number, number, number] },
];

export const v2Products = {
  lub: { aspect: 1.5, tag: [0.6999, 0.459, 0.0586, 0.1514] as [number, number, number, number] },
  elec: { aspect: 1.5, tag: [0.6641, 0.2197, 0.1172, 0.2881] as [number, number, number, number] },
  pharma: { aspect: 1.5, tag: [0.6576, 0.166, 0.1758, 0.2832] as [number, number, number, number] },
};

export const solutions = [
  {
    key: 'auth', name: 'Checko Authenticate', q: 'Is it real?',
    head: 'Your customers know it’s real, instantly.',
    body: 'A tactile 3D label, checked by AI that tells real depth from a flat copy. Any smartphone can scan it.',
    chips: ['Tactile 3D label', 'AI verification', 'Any smartphone'],
  },
  {
    key: 'engage', name: 'Checko Engage', q: 'Who bought it?',
    head: 'Speak to every customer after the scan.',
    body: 'The scan that proves it’s genuine opens a direct line to the buyer: warranty, demos and offers.',
    chips: ['Warranty registration', 'Demos and AR', 'Offers and cross-sell'],
  },
  {
    key: 'trace', name: 'Checko Trace', q: 'Where has it been?',
    head: 'Follow every product from line to shelf.',
    body: 'Link each unit to its carton and pallet, and follow it from factory to shop. Catch diversion early.',
    chips: ['Unit-to-pallet linking', 'Handheld scanning', 'Chain of custody'],
  },
  {
    key: 'insights', name: 'Checko Insights', q: 'What is the market telling you?',
    head: 'Turn every scan into market intelligence.',
    body: 'See where fakes appear and where genuine demand grows, region by region, with alerts when something looks wrong.',
    chips: ['Scans by region', 'Suspect-scan alerts', 'Scheduled reports'],
  },
] as const;

// img: public/assets/industries/<img>.webp (AI-generated studio shots, unbranded). Copy from the concept file.
export const useCases = {
  auth: 'Authentication', trace: 'Track and trace', geo: 'Geo-fencing', loyalty: 'Secure loyalty', warranty: 'Warranty registration', engage: 'Customer engagement',
} as const;
export type UseCase = keyof typeof useCases;

// copy from the concept sheet; use cases are the team's draft (only the ones that apply are shown)
// img: real product photography wearing the Checko label (public/assets/v2b-<img>.webp) — only industries with a real photo are shown
export const industries: { img: string; name: string; who: string; risk: string; fit: string; uses: UseCase[] }[] = [
  { img: 'v2b-lub', name: 'Spirits & beverages', who: 'Retailers and drinkers', risk: 'Counterfeit bottles pass off as the genuine brand.', fit: 'Authenticate every bottle, and reward the outlets that stock the real thing.', uses: ['auth', 'trace', 'geo', 'loyalty', 'engage'] },
  { img: 'v2b-elec', name: 'FMCG & staples', who: 'Everyday shoppers', risk: 'High-volume fakes slip onto shop shelves.', fit: 'Scan-to-verify with loyalty rewards that bring shoppers back to the real brand.', uses: ['auth', 'trace', 'geo', 'loyalty', 'engage'] },
  { img: 'v2b-pharma', name: 'Pharma & healthcare', who: 'Patients', risk: 'Fake medicines harm patients.', fit: 'Unit-level authentication and traceability, checkable at the pharmacy counter.', uses: ['auth', 'trace', 'geo', 'engage'] },
  { img: 'v2b-shoes', name: 'Snacks & packaged food', who: 'Everyday shoppers', risk: 'Counterfeit packaging copies trusted snack brands.', fit: 'Pack-level scan-to-verify that builds repeat trust at the shelf.', uses: ['auth', 'trace', 'loyalty', 'engage'] },
  { img: 'v2b-apparel', name: 'Apparel & textiles', who: 'Shoppers', risk: 'Fake brand tags pass for the real thing.', fit: 'Woven-in or swing-tag labels that shoppers can check in seconds.', uses: ['auth', 'engage'] },
];

// Figures retained from the supplied concept. Confirm with the Checko team before launch.
export const proof = [
  { value: '400M+', label: 'products protected' },
  { value: 'IIT Kanpur', label: 'where Checko was born', prefix: true },
  { value: '10+', label: 'industries' },
];
