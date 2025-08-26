import * as React from "react";
import { PageCache } from "@/routes/PageCache";

interface UsePageFieldProps<T, D> {
  /**
   * Function that extracts the initial value from the page data
   */
  value: (data: D) => T;
  
  /**
   * Function that updates the value (typically an API call)
   */
  update: (newValue: T) => Promise<any>;
  
  /**
   * Error handler called when validation fails or update fails
   */
  onError?: (error: any) => void;
  
  /**
   * Optional validation functions to run before update
   */
  validations?: ((newValue: T) => string | null)[];
  
  /**
   * Function to refresh page data after update
   */
  refreshPageData?: () => Promise<void>;
  
  /**
   * The page data and version from PageCache.useData()
   */
  pageData: {
    data: D;
    cacheVersion: number;
  };
  
  /**
   * Function to generate cache key for invalidation
   */
  pageCacheKey: (id: string) => string;
  
  /**
   * ID to use for cache invalidation
   */
  entityId: string;
}

/**
 * A hook for managing editable fields that sync with backend data
 * 
 * @example
 * const [name, setName] = usePageField({
 *   value: ({ project }) => project.name,
 *   update: (v) => Api.editProjectName({ projectId: project.id, name: v }),
 *   onError: (e) => showErrorToast(e),
 *   validations: [(v) => v.trim() === "" ? "Name cannot be empty" : null],
 *   pageData,
 *   pageCacheKey,
 *   entityId: project.id,
 *   refreshPageData,
 * });
 */
export function usePageField<T, D>({
  value,
  update,
  onError,
  validations,
  refreshPageData,
  pageData,
  pageCacheKey,
  entityId,
}: UsePageFieldProps<T, D>): [T, (v: T) => Promise<boolean>] {
  const { cacheVersion, data } = pageData;

  const [state, setState] = React.useState<T>(() => value(data));
  const [stateVersion, setStateVersion] = React.useState<number | undefined>(cacheVersion);

  React.useEffect(() => {
    if (cacheVersion !== stateVersion) {
      setState(value(data));
      setStateVersion(cacheVersion);
    }
  }, [value, data, cacheVersion, stateVersion]);

  const updateState = async (newVal: T): Promise<boolean> => {
    // Run validations if provided
    if (validations) {
      for (const validation of validations) {
        const error = validation(newVal);
        if (error) {
          onError?.(error);
          return false;
        }
      }
    }

    const oldVal = state;

    const successHandler = () => {
      // Invalidate the cache and refresh the data
      PageCache.invalidate(pageCacheKey(entityId));
      if (refreshPageData) {
        refreshPageData();
      }
    };

    const errorHandler = (error: any) => {
      setState(oldVal);
      onError?.(error);
    };

    // Update the local state immediately for a responsive UI
    setState(newVal);

    // Call the update function (typically an API call)
    return update(newVal)
      .then((res) => {
        if (res === false || (typeof res === "object" && res?.success === false)) {
          errorHandler("Update failed");
          return false;
        } else {
          successHandler();
          return true;
        }
      })
      .catch((err) => {
        errorHandler(err);
        return false;
      });
  };

  return [state, updateState];
}
