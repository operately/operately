import { useNavigate } from "./hooks";

export function useNavigateTo(path: string) {
  const navigate = useNavigate();

  return () => {
    navigate(path);
  };
}
