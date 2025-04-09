/**
 * A robust utility for conditionally joining class names together
 * Works in browser and server environments
 * Based on the classnames library API
 */

// Define types for arguments that can be passed to classNames
type ClassValue =
  | string
  | number
  | ClassDictionary
  | ClassArray
  | undefined
  | null
  | boolean;
interface ClassDictionary {
  [id: string]: any;
}
interface ClassArray extends Array<ClassValue> {}

/**
 * Joins class names together
 * @param {...ClassValue} args - Any number of arguments of various types
 * @returns {string} - Space-separated class names
 */
export default function classNames(...args: ClassValue[]): string {
  return args.reduce((classes: string, arg) => {
    if (!arg) return classes;
    return joinClasses(classes, parseClassArg(arg));
  }, "");
}

/**
 * Parse a single argument value
 * @param {ClassValue} arg - The argument to parse
 * @returns {string} - The resulting class string
 */
function parseClassArg(arg: ClassValue): string {
  // Handle strings and numbers directly
  if (typeof arg === "string" || typeof arg === "number") {
    return String(arg);
  }

  // If not an object, skip it
  if (typeof arg !== "object" || arg === null) {
    return "";
  }

  // Handle arrays by recursively calling classNames
  if (Array.isArray(arg)) {
    return classNames(...arg);
  }

  // Handle objects with custom toString methods
  // (excluding native Object.prototype.toString)
  if (
    arg.toString !== Object.prototype.toString &&
    (!arg.toString.toString ||
      !arg.toString.toString().includes("[native code]"))
  ) {
    return arg.toString();
  }

  // Handle objects where keys are class names and values are boolean
  return Object.entries(arg as ClassDictionary)
    .filter(([_, value]) => Boolean(value))
    .map(([key]) => key)
    .join(" ");
}

/**
 * Join two class strings together with a space
 * @param {string} a - First class string
 * @param {string} b - Second class string
 * @returns {string} - Joined class string
 */
function joinClasses(a: string, b: string): string {
  if (!a) return b;
  if (!b) return a;
  return a + " " + b;
}
