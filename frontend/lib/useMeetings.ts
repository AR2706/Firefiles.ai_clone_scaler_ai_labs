import { useCallback, useEffect, useState } from "react";

import { api } from "./api";
import type { MeetingFilters, MeetingListItem } from "./types";

/** Load a list of meetings once for pages that show them all (up to 100). */
export function useMeetings(source?: MeetingFilters["source"]) {
  const [meetings, setMeetings] = useState<MeetingListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(() => {
    api
      .listMeetings({ sort: "recent", page_size: 100, source })
      .then((page) => {
        setMeetings(page.items);
        setError(null);
      })
      .catch((reason: Error) => setError(reason.message));
  }, [source]);

  useEffect(reload, [reload]);
  return { meetings, error, reload };
}
