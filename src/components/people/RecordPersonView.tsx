"use client";

import { useEffect } from "react";

import { recordPersonView } from "@/lib/search/recent-people";

/**
 * Records a person view in localStorage on mount, feeding the dashboard
 * search's "Recent People" suggestions. Renders nothing.
 */
export function RecordPersonView({
  id,
  name,
  company,
}: {
  id: string;
  name: string;
  company: string | null;
}) {
  useEffect(() => {
    recordPersonView({ id, name, company });
  }, [id, name, company]);

  return null;
}
