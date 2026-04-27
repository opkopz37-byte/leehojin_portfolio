import type { Block } from "./blocks";
import postsJson from "../public/data/posts.json";

export const SUB_CATEGORIES = ["TECH", "LEVEL", "LIGHTING", "WEB"] as const;
export type SubCategory = (typeof SUB_CATEGORIES)[number];

export type MediaItem =
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      caption?: string;
      autoplay?: boolean;
    };

export type Project = {
  slug: string;
  title: string;
  category: "Project" | "Personal";
  company?: string;
  projectName?: string;
  subTitle?: string;
  /** ISO date string YYYY-MM-DD. Project start date. */
  startDate?: string;
  /** ISO date string YYYY-MM-DD. Project end date. */
  endDate?: string;
  role: string;
  tags: string[];
  summary: string;
  /** Cover / thumbnail image URL or data URL. Shown on list cards and hero. */
  coverImage?: string;
  /** Sub-category for filtering */
  subCategory?: SubCategory;
  /** Body source — interpreted according to bodyFormat. */
  body: string;
  /** Format of `body`. Defaults to "markdown" when omitted. */
  bodyFormat?: "markdown" | "html";
  /** When set, the post was edited in block mode; preserves structure for round-trip editing. */
  blocks?: Block[];
  media: MediaItem[];
  links?: { label: string; href: string }[];
  /** YouTube / Vimeo URLs shown as embedded players at the top of the post. */
  videoLinks?: string[];
};

const _remotePosts = postsJson as unknown as Project[];

/** Single source of truth: posts.json. No more hard-coded placeholders so
 *  deleting/editing through admin always matches what is published. */
export const staticPlaceholders: Project[] = [];
export const projects: Project[] = [..._remotePosts];

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function formatDate(date?: string): string {
  if (!date) return "";
  const [y, m, d] = date.split("-");
  if (!y) return "";
  if (!m) return y;
  if (!d) return `${y}.${m}`;
  return `${y}.${m}.${d}`;
}

export function formatProjectDate(start?: string, end?: string): string {
  const s = formatDate(start);
  const e = formatDate(end);
  if (s && e) return `${s} — ${e}`;
  if (s) return `${s} —`;
  if (e) return `— ${e}`;
  return "";
}
