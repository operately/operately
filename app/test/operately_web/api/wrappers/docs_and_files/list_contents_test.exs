defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.ListContentsTest do
  use OperatelyWeb.TurboCase

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_api_token(:api_token, :creator, read_only: false)
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:creator, :space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
    |> Factory.add_document(:document, :hub)
  end

  test "lists contents by space_id", ctx do
    assert {200, res} =
             external_query(ctx.conn, ctx.api_token, "documents/list_contents", %{
               space_id: Paths.space_id(ctx.space)
             })

    all_nodes = res.nodes ++ res.draft_nodes

    assert Enum.any?(all_nodes, fn node ->
             node[:document] && node.document.id == Paths.document_id(ctx.document)
           end)
  end

  test "lists contents by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
      |> Factory.add_document(:project_document, :project_hub)

    assert {200, res} =
             external_query(ctx.conn, ctx.api_token, "documents/list_contents", %{
               project_id: Paths.project_id(ctx.project)
             })

    all_nodes = res.nodes ++ res.draft_nodes

    assert Enum.any?(all_nodes, fn node ->
             node[:document] && node.document.id == Paths.document_id(ctx.project_document)
           end)
  end

  test "lists contents by goal_id", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)
      |> Factory.add_document(:goal_document, :goal_hub)

    assert {200, res} =
             external_query(ctx.conn, ctx.api_token, "documents/list_contents", %{
               goal_id: Paths.goal_id(ctx.goal)
             })

    all_nodes = res.nodes ++ res.draft_nodes

    assert Enum.any?(all_nodes, fn node ->
             node[:document] && node.document.id == Paths.document_id(ctx.goal_document)
           end)
  end

  test "requires hub scope", ctx do
    assert {400, _} = external_query(ctx.conn, ctx.api_token, "documents/list_contents", %{})
  end
end
