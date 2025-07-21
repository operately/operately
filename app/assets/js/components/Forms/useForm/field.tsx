import { Target, Goal } from "@/models/goals";
import { DatePicker } from "turboui";

export type FieldValue =
  | number
  | string
  | boolean
  | null
  | undefined
  | Date
  | Goal
  | Target[]
  | DatePicker.ContextualDate
  | FieldObject
  | FieldObject[]
  | FieldValue[];

export interface FieldObject {
  [key: string]: FieldValue;
}
