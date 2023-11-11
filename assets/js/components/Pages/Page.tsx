import { useDocumentTitle } from "@/layouts/header";

export function Page({ title, children }) {
  useDocumentTitle(title);

  return children;
}
