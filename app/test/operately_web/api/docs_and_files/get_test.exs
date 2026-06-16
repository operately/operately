defmodule OperatelyWeb.Api.DocsAndFiles.GetTest do
  use OperatelyWeb.TurboCase

  alias Operately.Repo
  alias OperatelyWeb.Api.Serializer

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_api_token(:api_token, :creator)
    |> Factory.add_space(:space)
    |> Factory.add_space(:space2)
    |> Factory.fetch_default_resource_hub(:hub1, :space)
    |> Factory.fetch_default_resource_hub(:hub2, :space2)
    |> Factory.add_folder(:folder1, :hub1)
    |> Factory.add_folder(:folder2, :hub1)
    |> Factory.add_folder(:folder3, :hub1)
    |> Factory.add_folder(:folder4, :hub2)
    |> Factory.add_folder(:folder5, :hub2)
  end

  test "gets hub by space_id with include_nodes", ctx do
    assert {200, res} =
             external_query(ctx.conn, ctx.api_token, "docs_and_files/get", %{
               space_id: Paths.space_id(ctx.space),
               include_nodes: true
             })

    assert res.resource_hub.name == ctx.hub1.name
    assert length(res.resource_hub.nodes) == 3

    [ctx.folder1, ctx.folder2, ctx.folder3]
    |> Enum.each(fn folder ->
      node = Repo.preload(folder, :node).node
      assert Enum.find(res.resource_hub.nodes, &(&1.id == Paths.node_id(node)))
    end)
  end

  test "gets hub by project_id with include_project", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)

    assert {200, res} =
             external_query(ctx.conn, ctx.api_token, "docs_and_files/get", %{
               project_id: Paths.project_id(ctx.project),
               include_project: true
             })

    assert res.resource_hub.project == Serializer.serialize(ctx.project, level: :essential)
  end

  test "requires id, space_id, or project_id", ctx do
    assert {400, _} = external_query(ctx.conn, ctx.api_token, "docs_and_files/get", %{})
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_query(ctx.conn, ctx.api_token, "docs_and_files/get", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project)
             })
  end

  test "rejects id with project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_query(ctx.conn, ctx.api_token, "docs_and_files/get", %{
               id: Paths.resource_hub_id(ctx.hub1),
               project_id: Paths.project_id(ctx.project)
             })
  end
end
