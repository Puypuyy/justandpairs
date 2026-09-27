export class ApiError extends Error {
  readonly code: "NOT_FOUND" | "INVALID_REQUEST" | "UNAVAILABLE";
  constructor(code: ApiError["code"], message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}
