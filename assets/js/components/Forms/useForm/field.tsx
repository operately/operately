import { Target } from "@/models/goals";

export type FieldValue = number | string | boolean | null | undefined | Date | Target[] | FieldObject | FieldObject[] | FieldValue[];

export interface FieldObject {
  [key: string]: FieldValue;
}
