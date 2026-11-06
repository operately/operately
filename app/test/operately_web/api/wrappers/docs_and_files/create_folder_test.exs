defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.CreateFolderTest do
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

  test "explicit hub and folder-only requests resolve the non-default hub", ctx do
    ctx = ctx |> Factory.add_resource_hub(:other, :space, :creator) |> Factory.add_folder(:parent, :other)
    for scope <- [%{resource_hub_id: Paths.resource_hub_id(ctx.other)}, %{folder_id: Paths.folder_id(ctx.parent)}] do
      assert {200, response} = external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", Map.put(scope, :name, "Nested"))
      assert response.resource_hub_id == Paths.resource_hub_id(ctx.other.id)
    end
  end

  test "unavailable default returns structured retry details", ctx do
    ctx.space |> Ecto.Changeset.change(default_resource_hub_id: nil) |> Repo.update!()
    assert {400, response} = external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{space_id: Paths.space_id(ctx.space), name: "Folder"})
    assert response.details.code == "default_resource_hub_unavailable"
    assert [%{id: id}] = response.details.candidates
    assert id == Paths.resource_hub_id(ctx.hub.id)
  end

  test "creates folder by space_id", ctx do
    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{
               space_id: Paths.space_id(ctx.space),
               name: "My folder"
             })

    folders = ResourceHubs.list_folders(ctx.hub)
    assert length(folders) == 1
    assert res.folder == Serializer.serialize(hd(folders))
  end

  test "creates folder by project_id", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{
               project_id: Paths.project_id(ctx.project),
               name: "Project folder"
             })

    folders = ResourceHubs.list_folders(ctx.project_hub)
    assert length(folders) == 1
    assert res.folder == Serializer.serialize(hd(folders))
  end

  test "creates folder by goal_id", ctx do
    ctx =
      ctx
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)

    assert {200, res} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{
               goal_id: Paths.goal_id(ctx.goal),
               name: "Goal folder"
             })

    folders = ResourceHubs.list_folders(ctx.goal_hub)
    assert length(folders) == 1
    assert res.folder == Serializer.serialize(hd(folders))
  end

  test "requires hub scope", ctx do
    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{name: "My folder"})
  end

  test "rejects both space_id and project_id", ctx do
    ctx = Factory.add_project(ctx, :project, :space)

    assert {400, _} =
             external_mutation(ctx.conn, ctx.api_token, "documents/create_folder", %{
               space_id: Paths.space_id(ctx.space),
               project_id: Paths.project_id(ctx.project),
               name: "My folder"
             })
  end
end
