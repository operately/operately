import { useNavigate } from "react-router-dom";

export function useNavigateTo(path: string) {
  const navigate = useNavigate();

  return () => {
    navigate(path);
  };
}
