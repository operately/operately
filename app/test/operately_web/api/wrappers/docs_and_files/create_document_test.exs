defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateDocumentTest do
  use OperatelyWeb.TurboCase

  alias Operately.ResourceHubs
  alias Operately.Support.RichText

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_api_token(:api_token, :creator, read_only: false)
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:creator, :space)
    |> Factory.fetch_default_resource_hub(:hub, :space)
  end

  test "creates document by space_id", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_document", %{
               space_id: Paths.space_id(ctx.space),
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })

    documents = ResourceHubs.list_documents(ctx.hub)
    assert length(documents) == 1
    assert res.document.id == Paths.document_id(hd(documents))
  end

  test "creates document by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_document", %{
               project_id: Paths.project_id(ctx.project),
               name: "Project document",
               content: RichText.rich_text("content", :as_string)
             })

    documents = ResourceHubs.list_documents(ctx.project_hub)
    assert length(documents) == 1
    assert res.document.id == Paths.document_id(hd(documents))
  end

  test "creates document by goal_id", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_document", %{
               goal_id: Paths.goal_id(ctx.goal),
               name: "Goal document",
               content: RichText.rich_text("content", :as_string)
             })

    documents = ResourceHubs.list_documents(ctx.goal_hub)
    assert length(documents) == 1
    assert res.document.id == Paths.document_id(hd(documents))
  end

  test "requires hub scope", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_document", %{
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_document", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project),
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })
  end
end
