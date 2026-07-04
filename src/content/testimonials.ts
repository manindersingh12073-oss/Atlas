/**
 * Landing page testimonials.
 *
 * PLACEHOLDER DATA — these three quotes are illustrative and must be
 * replaced with real, attributed quotes before public launch.
 *
 * To add a new testimonial: append an object to the array below.
 * `image` is optional (path under /public/marketing/testimonials/); when
 * omitted, the UI falls back to an initials avatar. Set `featured: true`
 * to give a quote a larger treatment if the section design supports it.
 */

export type Testimonial = {
  name: string;
  role: string;
  company: string;
  quote: string;
  image?: string;
  featured?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    name: "Dr. A. Patel",
    role: "Clinical Researcher",
    company: "Imperial College London",
    quote:
      "I used to dread the follow-up after conferences. Now I open Atlas on the way home and everything is already organised.",
  },
  {
    name: "J. Morrison",
    role: "Partner",
    company: "Seedcamp",
    quote:
      "The relationship mapping is brilliant. I can see exactly who introduced me to whom, and trace warm intro paths across my whole network.",
  },
  {
    name: "S. Okonkwo",
    role: "Founder",
    company: "AI Health Startup",
    quote:
      "I'd been looking for something like this for years. Simple, fast, and it actually makes me better at staying in touch.",
  },
];
