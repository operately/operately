import { useRouter } from "./Router";

export { useSearchParams } from "./useSearchParams";
export { useLoadedData } from "./loadedData";

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { location } = useRouter();
  return location;
}

export function useRevalidator() {
  const { revalidate } = useRouter();
  return { revalidate };
}

export function useRouteError() {
  const { error } = useRouter();
  return error;
}
