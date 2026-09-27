import { useCallback, useEffect, useRef, useState } from "react";
import type { RfqDraft } from "./rfq-types.ts";
import { useApi } from "./react.tsx";

// Serialize writes so a slow save can never overwrite a newer edit.
export function useRfqAutosave(draft: RfqDraft) {
  const api = useApi();
  const latest = useRef(draft);
  latest.current = draft;
  const revision = useRef(draft.revision);
  const saved = useRef(JSON.stringify(draft));
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const active = useRef(true);
  const completed = useRef(false);
  const [status, setStatus] = useState("Saved on this browser");
  const [error, setError] = useState<Error | null>(null);
  const saveNow = useCallback((): Promise<RfqDraft> => {
    const operation = chain.current
      .catch(() => {})
      .then(async () => {
        const snapshot = latest.current;
        if (completed.current || saved.current === JSON.stringify(snapshot))
          return { ...snapshot, revision: revision.current };
        if (active.current) {
          setStatus("Saving locally…");
          setError(null);
        }
        try {
          const result = await api.rfq.saveDraft({
            ...snapshot,
            revision: revision.current,
          });
          revision.current = result.revision;
          saved.current = JSON.stringify(snapshot);
          if (active.current)
            setStatus(
              latest.current === snapshot
                ? "Saved on this browser"
                : "Unsaved changes",
            );
          return result;
        } catch (e) {
          const problem =
            e instanceof Error ? e : new Error("Could not save this draft.");
          if (active.current) {
            setError(problem);
            setStatus("Not saved");
          }
          throw problem;
        }
      });
    chain.current = operation;
    return operation;
  }, [api]);
  useEffect(() => {
    if (JSON.stringify(draft) === saved.current) return;
    setStatus("Unsaved changes");
    const timer = setTimeout(() => {
      void saveNow().catch(() => {});
    }, 450);
    return () => clearTimeout(timer);
  }, [draft, saveNow]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      void saveNow().catch(() => {});
    };
  }, [saveNow]);
  return {
    status,
    error,
    saveNow,
    complete: () => {
      completed.current = true;
    },
  };
}
