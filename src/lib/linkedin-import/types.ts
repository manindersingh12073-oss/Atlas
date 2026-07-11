// Shape produced directly from a parsed CSV row — matches LinkedIn's own
// column names conceptually, not Atlas's `people` schema, since one
// LinkedInCandidate becomes one insert row only after the user confirms it.
export type LinkedInCandidate = {
  name: string;
  company: string;
  role: string;
  linkedinUrl: string;
  email: string;
  connectedOn: string;
};

// Client-side view model: adds the fields the review UI needs (a stable row
// id, duplicate flag, checkbox state) without touching the parse layer.
export type ImportCandidate = LinkedInCandidate & {
  id: string;
  isDuplicate: boolean;
  selected: boolean;
};
