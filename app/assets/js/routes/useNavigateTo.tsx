import { useNavigate } from "react-router";

export function useNavigateTo(path: string) {
  const navigate = useNavigate();

  return () => {
    navigate(path);
  };
}
