export type FieldValue = number | string | boolean | null | undefined | FieldObject | FieldObject[] | FieldValue[];

export interface FieldObject {
  [key: string]: FieldValue;
}
