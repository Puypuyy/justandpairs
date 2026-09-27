export class ApiError extends Error {
  readonly code:
    | "NOT_FOUND"
    | "INVALID_REQUEST"
    | "UNAVAILABLE"
    | "VALIDATION_ERROR"
    | "CONFLICT";
  readonly fieldErrors: Record<string, string>;
  constructor(
    code: ApiError["code"],
    message: string,
    fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}
