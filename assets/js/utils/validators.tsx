export class Validators {
  public static nonEmptyNumber(value: number | null | undefined): boolean {
    return value !== null && value !== undefined;
  }
}
