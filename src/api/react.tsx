import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Alert, Button, CircularProgress } from "@mui/material";
import { api } from "./client.ts";
import type {
  CustomerApi,
  EstimateRequest,
  ProductFilters,
  SiteData,
} from "./contracts.ts";

export type ApiResult<T> = {
  data: T | undefined;
  loading: boolean;
  error: Error | null;
  retry: () => void;
};

// Abort old requests and ignore late responses, even if a future adapter ignores its signal.
export function useRequest<T>(
  request: (signal: AbortSignal) => Promise<T>,
): ApiResult<T> {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{
    request: typeof request;
    attempt: number;
    data?: T;
    error: Error | null;
    loading: boolean;
  }>({ request, attempt, error: null, loading: true });
  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    setState({ request, attempt, loading: true, error: null });
    Promise.resolve()
      .then(() => request(controller.signal))
      .then(
        (data) => {
          if (active)
            setState({ request, attempt, data, loading: false, error: null });
        },
        (error) => {
          if (active)
            setState({
              request,
              attempt,
              loading: false,
              error:
                error instanceof Error
                  ? error
                  : new Error("Data could not be loaded."),
            });
        },
      );
    return () => {
      active = false;
      controller.abort();
    };
  }, [request, attempt]);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  if (state.request !== request || state.attempt !== attempt)
    return { data: undefined, loading: true, error: null, retry };
  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    retry,
  };
}

const ClientContext = createContext<CustomerApi>(api);
export function useApi() {
  return useContext(ClientContext);
}
const SiteContext = createContext<SiteData | null>(null);

export function ApiProvider({
  children,
  client = api,
}: {
  children: ReactNode;
  client?: CustomerApi;
}) {
  const request = useCallback(
    (signal: AbortSignal) => client.getSiteData({ signal }),
    [client],
  );
  const result = useRequest(request);
  if (result.loading)
    return (
      <div className="container section" role="status" aria-live="polite">
        <CircularProgress size={24} aria-label="Loading collection" />
        <p>Preparing your collection…</p>
      </div>
    );
  if (result.error || !result.data)
    return (
      <div className="container section">
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={result.retry}>
              Try again
            </Button>
          }
        >
          We couldn't load the collection. Please try again.
        </Alert>
      </div>
    );
  return (
    <ClientContext.Provider value={client}>
      <SiteContext.Provider value={result.data}>
        {children}
      </SiteContext.Provider>
    </ClientContext.Provider>
  );
}
export function useSiteData() {
  const data = useContext(SiteContext);
  if (!data) throw new Error("useSiteData must be used inside ApiProvider.");
  return data;
}
export function useProducts(filters: ProductFilters) {
  const client = useContext(ClientContext);
  const key = JSON.stringify(filters);
  const request = useMemo(
    () => (signal: AbortSignal) =>
      client.listProducts(JSON.parse(key) as ProductFilters, { signal }),
    [client, key],
  );
  return useRequest(request);
}
export function usePriceEstimate(input?: EstimateRequest) {
  const client = useContext(ClientContext);
  const productId = input?.productId,
    size = input?.size,
    finish = input?.finish,
    quantity = input?.quantity;
  const request = useCallback(
    (signal: AbortSignal) =>
      productId === undefined ||
      size === undefined ||
      finish === undefined ||
      quantity === undefined
        ? Promise.resolve(null)
        : client.estimatePrice(
            { productId, size, finish, quantity },
            { signal },
          ),
    [client, productId, size, finish, quantity],
  );
  return useRequest(request);
}
