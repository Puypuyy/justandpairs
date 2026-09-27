import type { CustomerApi } from "./contracts.ts";
import { createMockApi } from "./mock/adapter.ts";

// This is the only adapter selection point. Replace with createAwsApi(...) later.
// Nothing outside this folder should import mock fixtures or perform data requests.
export const api: CustomerApi = createMockApi();
