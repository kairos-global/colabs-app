// Plain module — no "use server". Safe to import from client and server components.

export const LISTING_CATEGORIES = [
  // Photography & Film
  "photographer",
  "videographer",
  "cinematographer",
  "film-director",
  "screenwriter",
  "film-editor",
  // Music
  "musician",
  "vocalist",
  "songwriter",
  "music-producer",
  "dj",
  "beat-maker",
  "audio-engineer",
  "sound-designer",
  // Animation & VFX
  "animator",
  "motion-designer",
  "vfx-artist",
  "3d-artist",
  // Design
  "graphic-designer",
  "brand-designer",
  "art-director",
  "illustrator",
  "ui-ux-designer",
  "typographer",
  // Art
  "painter",
  "muralist",
  "sculptor",
  "digital-artist",
  "printmaker",
  "collage-artist",
  // Fashion
  "fashion-designer",
  "stylist",
  "costume-designer",
  "textile-artist",
  // Performance
  "dancer",
  "choreographer",
  "actor",
  "performer",
  // Events & Production
  "event-producer",
  "set-designer",
  "lighting-designer",
  // Marketing & Content
  "marketer",
  "content-creator",
  "copywriter",
  "social-media",
  "publicist",
] as const;

export type ListingCategory = (typeof LISTING_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ListingCategory, string> = {
  "photographer": "Photographer",
  "videographer": "Videographer",
  "cinematographer": "Cinematographer",
  "film-director": "Film Director",
  "screenwriter": "Screenwriter",
  "film-editor": "Film Editor",
  "musician": "Musician",
  "vocalist": "Vocalist",
  "songwriter": "Songwriter",
  "music-producer": "Music Producer",
  "dj": "DJ",
  "beat-maker": "Beat Maker",
  "audio-engineer": "Audio Engineer",
  "sound-designer": "Sound Designer",
  "animator": "Animator",
  "motion-designer": "Motion Designer",
  "vfx-artist": "VFX Artist",
  "3d-artist": "3D Artist",
  "graphic-designer": "Graphic Designer",
  "brand-designer": "Brand Designer",
  "art-director": "Art Director",
  "illustrator": "Illustrator",
  "ui-ux-designer": "UI / UX Designer",
  "typographer": "Typographer",
  "painter": "Painter",
  "muralist": "Muralist",
  "sculptor": "Sculptor",
  "digital-artist": "Digital Artist",
  "printmaker": "Printmaker",
  "collage-artist": "Collage Artist",
  "fashion-designer": "Fashion Designer",
  "stylist": "Stylist",
  "costume-designer": "Costume Designer",
  "textile-artist": "Textile Artist",
  "dancer": "Dancer",
  "choreographer": "Choreographer",
  "actor": "Actor",
  "performer": "Performer",
  "event-producer": "Event Producer",
  "set-designer": "Set Designer",
  "lighting-designer": "Lighting Designer",
  "marketer": "Marketer",
  "content-creator": "Content Creator",
  "copywriter": "Copywriter",
  "social-media": "Social Media",
  "publicist": "Publicist",
};

export const CATEGORY_GROUPS: { label: string; keys: ListingCategory[] }[] = [
  {
    label: "Photography & Film",
    keys: ["photographer", "videographer", "cinematographer", "film-director", "screenwriter", "film-editor"],
  },
  {
    label: "Music",
    keys: ["musician", "vocalist", "songwriter", "music-producer", "dj", "beat-maker", "audio-engineer", "sound-designer"],
  },
  {
    label: "Animation & VFX",
    keys: ["animator", "motion-designer", "vfx-artist", "3d-artist"],
  },
  {
    label: "Design",
    keys: ["graphic-designer", "brand-designer", "art-director", "illustrator", "ui-ux-designer", "typographer"],
  },
  {
    label: "Art",
    keys: ["painter", "muralist", "sculptor", "digital-artist", "printmaker", "collage-artist"],
  },
  {
    label: "Fashion",
    keys: ["fashion-designer", "stylist", "costume-designer", "textile-artist"],
  },
  {
    label: "Performance",
    keys: ["dancer", "choreographer", "actor", "performer"],
  },
  {
    label: "Events & Production",
    keys: ["event-producer", "set-designer", "lighting-designer"],
  },
  {
    label: "Marketing & Content",
    keys: ["marketer", "content-creator", "copywriter", "social-media", "publicist"],
  },
];
