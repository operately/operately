defmodule OperatelyWeb.Api.DocsAndFiles.CreateLinkTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_api_token(:api_token, :creator, read_only: false)
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:creator, :space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
  end

  test "creates link by space_id", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "docs_and_files/create_link", %{
               space_id: Paths.space_id(ctx.space),
               name: "My link",
               url: "http://localhost:4000",
               type: "other"
             })

    links = ResourceHubs.list_links(ctx.hub)
    assert length(links) == 1
    assert res.link.id == Paths.link_id(hd(links))
  end

  test "creates link by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "docs_and_files/create_link", %{
               project_id: Paths.project_id(ctx.project),
               name: "Project link",
               url: "https://example.com",
               type: "other"
             })

    links = ResourceHubs.list_links(ctx.project_hub)
    assert length(links) == 1
    assert res.link.id == Paths.link_id(hd(links))
  end

  test "requires hub scope", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "docs_and_files/create_link", %{
               name: "My link",
               url: "http://localhost:4000",
               type: "other"
             })
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "docs_and_files/create_link", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project),
               name: "My link",
               url: "http://localhost:4000",
               type: "other"
             })
  end
end
