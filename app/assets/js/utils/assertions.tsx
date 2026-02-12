export function assertPresent<T>(value: T | null | undefined, message?: string): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || "Value is null or undefined");
  }
}

export function assertPresentOr404<T>(value: T | null | undefined): asserts value is T {
  if (value === null || value === undefined) {
    const error = new Error("404: Not Found");
    (error as any).status = 404;
    throw error;
  }
}
