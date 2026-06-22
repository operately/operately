defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFileTest do
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
    |> Factory.add_blob(:blob)
  end

  test "creates file by space_id", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_file", %{
               space_id: Paths.space_id(ctx.space),
               files: [
                 %{
                   blob_id: ctx.blob.id,
                   name: "My file",
                   description: RichText.rich_text("description", :as_string)
                 }
               ]
             })

    files = ResourceHubs.list_files(ctx.hub)
    assert length(files) == 1
    assert hd(res.files).id == Paths.file_id(hd(files))
  end

  test "creates file by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_file", %{
               project_id: Paths.project_id(ctx.project),
               files: [
                 %{
                   blob_id: ctx.blob.id,
                   name: "Project file",
                   description: RichText.rich_text("description", :as_string)
                 }
               ]
             })

    files = ResourceHubs.list_files(ctx.project_hub)
    assert length(files) == 1
    assert hd(res.files).id == Paths.file_id(hd(files))
  end

  test "creates file by goal_id", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_file", %{
               goal_id: Paths.goal_id(ctx.goal),
               files: [
                 %{
                   blob_id: ctx.blob.id,
                   name: "Goal file",
                   description: RichText.rich_text("description", :as_string)
                 }
               ]
             })

    files = ResourceHubs.list_files(ctx.goal_hub)
    assert length(files) == 1
    assert hd(res.files).id == Paths.file_id(hd(files))
  end

  test "requires hub scope", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_file", %{
               files: [
                 %{
                   blob_id: ctx.blob.id,
                   name: "My file",
                   description: RichText.rich_text("description", :as_string)
                 }
               ]
             })
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_file", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project),
               files: [
                 %{
                   blob_id: ctx.blob.id,
                   name: "My file",
                   description: RichText.rich_text("description", :as_string)
                 }
               ]
             })
  end
end
