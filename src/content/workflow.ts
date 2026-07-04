/**
 * "Conference workflow" timeline steps on the landing page.
 * To add or reorder a step, edit the array below — order is rendered order.
 */

export type WorkflowStep = {
  title: string;
  description: string;
};

export const workflowSteps: WorkflowStep[] = [
  {
    title: "Attend the event",
    description:
      "Conferences, meetups, demo days — wherever you meet people worth remembering.",
  },
  {
    title: "Open Atlas",
    description:
      "Takes seconds. Works on your phone before you've even left the building — or try it instantly with the live demo.",
  },
  {
    title: "Capture, one person at a time",
    description:
      "Name, company, context — captured before it fades, not reconstructed from memory a week later.",
  },
  {
    title: "Atlas organises everything",
    description:
      "Tags, relationships, timelines, and follow-ups, built automatically as you go.",
  },
  {
    title: "Reconnect exactly when it matters",
    description:
      "Atlas resurfaces the right person with the right context, months later.",
  },
];
