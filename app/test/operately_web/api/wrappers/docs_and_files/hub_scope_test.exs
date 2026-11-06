defmodule OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScopeTest do
  use Operately.DataCase

  alias Operately.Support.Factory
  alias OperatelyWeb.Api.Wrappers.DocsAndFiles.HubScope

  setup do
    Factory.setup(%{})
    |> Factory.add_space(:space)
    |> Factory.add_space_member(:creator, :space)
    |> Factory.fetch_default_resource_hub(:default_hub, :space)
    |> Factory.add_resource_hub(:other_hub, :space, :creator)
    |> Factory.add_folder(:folder, :other_hub)
  end

  test "space selection stays on its persisted default", ctx do
    assert {:ok, ctx.default_hub.id} == HubScope.resolve_hub_id(ctx.creator, %{space_id: ctx.space.id})
    assert Repo.get!(Operately.Groups.Group, ctx.space.id).default_resource_hub_id == ctx.default_hub.id
  end

  test "explicit hub and matching space select a non-default hub", ctx do
    assert {:ok, ctx.other_hub.id} ==
             HubScope.resolve_hub_id(ctx.creator, %{space_id: ctx.space.id, resource_hub_id: ctx.other_hub.id})
  end

  test "folder derives the hub without falling back to the space default", ctx do
    assert {:ok, ctx.other_hub.id} == HubScope.resolve_hub_id(ctx.creator, %{folder_id: ctx.folder.id})
    assert {:ok, ctx.other_hub.id} == HubScope.resolve_hub_id(ctx.creator, %{folder_id: ctx.folder.id, space_id: ctx.space.id})
  end

  test "conflicting folder and hub are rejected", ctx do
    assert {:error, :bad_request} =
             HubScope.resolve_hub_id(ctx.creator, %{folder_id: ctx.folder.id, resource_hub_id: ctx.default_hub.id})
  end

  test "missing default returns candidates without choosing a hub", ctx do
    Repo.update_all(from(s in Operately.Groups.Group, where: s.id == ^ctx.space.id), set: [default_resource_hub_id: nil])

    assert {:error, :bad_request, _, details} = HubScope.resolve_hub_id(ctx.creator, %{space_id: ctx.space.id})
    assert details.code == "default_resource_hub_unavailable"
    assert length(details.candidates) == 2
  end

  test "inaccessible selectors reveal neither candidates nor relationships", ctx do
    other = Factory.setup(%{}) |> Factory.add_space(:space) |> Factory.fetch_default_resource_hub(:hub, :space)

    assert {:error, :not_found} = HubScope.resolve_hub_id(ctx.creator, %{space_id: other.space.id})
    assert {:error, :not_found} = HubScope.resolve_hub_id(ctx.creator, %{resource_hub_id: other.hub.id})
    assert {:error, :not_found} = HubScope.resolve_hub_id(ctx.creator, %{folder_id: ctx.folder.id, space_id: other.space.id})
  end
end
