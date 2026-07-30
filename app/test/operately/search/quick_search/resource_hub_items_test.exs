defmodule Operately.Search.QuickSearch.ResourceHubItemsTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Search.QuickSearch.ResourceHubItems
  alias Operately.Support.Factory

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Knowledge")
    |> Factory.add_project(:project, :space, name: "Website")
    |> Factory.add_goal(:goal, :space, name: "Expansion")
    |> Factory.add_resource_hub(:space_hub, :space, :creator)
    |> Factory.add_resource_hub(:project_hub, :project, :creator)
    |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
    |> Factory.add_folder(:parent_folder, :space_hub)
    |> Factory.add_document(:document, :space_hub, folder: :parent_folder, name: "Searchable Document")
    |> Factory.add_file(:resource_file, :project_hub)
    |> Factory.add_link(:resource_link, :goal_hub)
    |> rename_items()
  end

  test "returns lightweight items with their current owner context", ctx do
    results = ResourceHubItems.search(ctx.creator, "Searchable")

    assert results.documents == [
             %{id: ctx.document.id, name: "Searchable Document", context: "Knowledge"}
           ]

    assert results.files == [
             %{id: ctx.resource_file.id, name: "Searchable File", context: "Website"}
           ]

    assert results.links == [
             %{id: ctx.resource_link.id, name: "Searchable Link", context: "Expansion"}
           ]
  end

  test "excludes drafts, deleted resources, and descendants of deleted folders", ctx do
    ctx.document |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
    Repo.soft_delete!(ctx.resource_file)
    Repo.soft_delete!(ctx.parent_folder)
    ctx.resource_link.node_id |> then(&Repo.get!(Operately.ResourceHubs.Node, &1)) |> Repo.soft_delete!()

    results = ResourceHubItems.search(ctx.creator, "Searchable")

    assert results.documents == []
    assert results.files == []
    assert results.links == []
  end

  test "excludes items owned by closed projects and goals", ctx do
    ctx =
      ctx
      |> Factory.close_project(:project)
      |> Factory.close_goal(:goal)

    results = ResourceHubItems.search(ctx.creator, "Searchable")

    assert results.files == []
    assert results.links == []
  end

  test "excludes items when their owning space is deleted", ctx do
    Repo.soft_delete!(ctx.space)

    results = ResourceHubItems.search(ctx.creator, "Searchable")

    assert results == %{folders: [], documents: [], files: [], links: []}
  end

  test "does not cross resource-hub boundaries while walking folders", ctx do
    ctx =
      ctx
      |> Factory.add_project(:other_project, :space)
      |> Factory.add_resource_hub(:other_hub, :other_project, :creator)
      |> Factory.add_folder(:other_folder, :other_hub)

    ctx.document.node_id
    |> then(&Repo.get!(Operately.ResourceHubs.Node, &1))
    |> Operately.ResourceHubs.Node.changeset(%{parent_folder_id: ctx.other_folder.id})
    |> Repo.update!()

    assert ResourceHubItems.search(ctx.creator, "Searchable Document").documents == []
  end

  test "applies company isolation and live permissions without relying on the search index", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_space(:private_space, name: "Private", company_permissions: Binding.no_access())
      |> Factory.add_resource_hub(:private_hub, :private_space, :creator)
      |> Factory.add_document(:private_document, :private_hub, name: "Permission Marker")

    other =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:other_space, name: "Other")
      |> Factory.add_resource_hub(:other_hub, :other_space, :creator)
      |> Factory.add_document(:other_document, :other_hub, name: "Permission Marker")

    assert ResourceHubItems.search(ctx.viewer, "Permission Marker").documents == []

    context = Access.get_context!(group_id: ctx.private_space.id)
    assert {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

    assert [%{id: document_id}] = ResourceHubItems.search(ctx.viewer, "Permission Marker").documents
    assert document_id == ctx.private_document.id
    refute document_id == other.other_document.id

    assert {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)
    assert ResourceHubItems.search(ctx.viewer, "Permission Marker").documents == []
  end

  test "limits each resource type to five stable results", ctx do
    ctx =
      Enum.reduce(1..6, ctx, fn index, acc ->
        acc
        |> Factory.add_folder(String.to_atom("folder_#{index}"), :space_hub)
        |> Factory.add_document(String.to_atom("document_#{index}"), :space_hub, name: "Capped Document #{index}")
        |> Factory.add_file(String.to_atom("file_#{index}"), :space_hub)
        |> Factory.add_link(String.to_atom("link_#{index}"), :space_hub)
        |> rename_capped_items(index)
      end)

    results = ResourceHubItems.search(ctx.creator, "Capped")

    for group <- ~w(folders documents files links)a do
      items = Map.fetch!(results, group)
      assert length(items) == 5
      assert Enum.map(items, & &1.id) == Enum.sort(Enum.map(items, & &1.id))
    end
  end

  defp rename_items(ctx) do
    file = ctx.resource_file |> Ecto.Changeset.change(name: "Searchable File") |> Repo.update!()
    link = ctx.resource_link |> Ecto.Changeset.change(name: "Searchable Link") |> Repo.update!()

    %{ctx | resource_file: file, resource_link: link}
  end

  defp rename_capped_items(ctx, index) do
    folder_key = String.to_atom("folder_#{index}")
    file_key = String.to_atom("file_#{index}")
    link_key = String.to_atom("link_#{index}")

    folder = ctx[folder_key] |> Ecto.Changeset.change(name: "Capped Folder #{index}") |> Repo.update!()
    file = ctx[file_key] |> Ecto.Changeset.change(name: "Capped File #{index}") |> Repo.update!()
    link = ctx[link_key] |> Ecto.Changeset.change(name: "Capped Link #{index}") |> Repo.update!()

    ctx
    |> Map.put(folder_key, folder)
    |> Map.put(file_key, file)
    |> Map.put(link_key, link)
  end
end
