import { Target, Goal } from "@/models/goals";

export type FieldValue =
  | number
  | string
  | boolean
  | null
  | undefined
  | Date
  | Goal
  | Target[]
  | FieldObject
  | FieldObject[]
  | FieldValue[];

export interface FieldObject {
  [key: string]: FieldValue;
}
