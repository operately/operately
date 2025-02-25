import { useRouter } from "./Router";

export function useNavigate() {
  const { navigate } = useRouter();
  return navigate;
}

export function useLocation() {
  const { location } = useRouter();
  return { pathname: location };
}

export function useRevalidator() {
  const { revalidate } = useRouter();
  return { revalidate };
}

export function useLoadedData() {
  const { loadedData } = useRouter();
  return loadedData;
}