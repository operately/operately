import { Target, Goal } from "@/models/goals";
import { DateField } from "turboui";

export type FieldValue =
  | number
  | string
  | boolean
  | null
  | undefined
  | Date
  | Goal
  | Target[]
  | DateField.ContextualDate
  | FieldObject
  | FieldObject[]
  | FieldValue[];

export interface FieldObject {
  [key: string]: FieldValue;
}
