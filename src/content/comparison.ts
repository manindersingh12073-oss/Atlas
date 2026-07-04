/**
 * "Without Atlas / With Atlas" comparison pairs. Each entry in `without`
 * is paired by index with the same-index entry in `with_` (named to
 * avoid the `with` reserved word), so keep the two arrays the same length
 * and in a matching order when editing.
 */

export const comparisonIntro =
  "The business card survived. The conversation didn't.";

export const without: string[] = [
  "“I know I've met them before…”",
  "“I can't remember where.”",
  "“I forgot to follow up.”",
  "“I lost their business card.”",
  "“I don't know who introduced us.”",
];

export const with_: string[] = [
  "“Met at CogX, six weeks ago.”",
  "“They work at DeepMind now.”",
  "“Ali introduced you.”",
  "“You promised to send a paper — due Thursday.”",
  "“Time to reconnect.”",
];
