defmodule OperatelyWeb.Api.DocsAndFiles.CreateDocumentTest do
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

  test "creates document by resource_hub_id for CLI <= 1.6.0 backward compatibility", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })

    documents = ResourceHubs.list_documents(ctx.hub)
    assert length(documents) == 1
    assert res.document.id == Paths.document_id(hd(documents))
  end

  test "creates document by space_id", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
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
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
               project_id: Paths.project_id(ctx.project),
               name: "Project document",
               content: RichText.rich_text("content", :as_string)
             })

    documents = ResourceHubs.list_documents(ctx.project_hub)
    assert length(documents) == 1
    assert res.document.id == Paths.document_id(hd(documents))
  end

  test "requires hub scope", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })
  end

  test "rejects resource_hub_id with space_id", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               space_id: Paths.space_id(ctx.space),
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project),
               name: "My document",
               content: RichText.rich_text("content", :as_string)
             })
  end
end
