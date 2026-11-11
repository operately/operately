import Api from "@/api";
import { Paths } from "@/routes/paths";
import { replace } from "react-router";

export async function legacyLoader({
  params,
  request,
}: {
  params: { companyId: string; id: string };
  request: Request;
}) {
  const { space } = await Api.spaces.getQuery({ id: params.id });
  if (!space?.defaultTaskBoardId) throw new Response(null, { status: 404 });

  const paths = new Paths({ companyId: params.companyId });
  const destination = paths.spaceKanbanPath(space.id, space.defaultTaskBoardId);

  return replace(destination + new URL(request.url).search);
}
