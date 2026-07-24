defmodule Operately.Search.ResourceHubSourcesTest do
  use Operately.DataCase, async: true

  alias Operately.Access
  alias Operately.Projects.Project
  alias Operately.ResourceHubs.File, as: ResourceFile
  alias Operately.ResourceHubs.Link, as: ResourceLink
  alias Operately.ResourceHubs.Node
  alias Operately.Search.SourceRegistry
  alias Operately.Search.Sources.ResourceHub.{Document, File, Folder, Link}
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:parent_folder, :hub)
    |> Factory.add_folder(:nested_folder, :hub, :parent_folder)
    |> Factory.add_document(:document, :hub, folder: :nested_folder, name: "Search handbook", content: RichText.rich_text("Document body"))
    |> Factory.add_file(:resource_file, :hub, folder: :nested_folder)
    |> Factory.add_link(:resource_link, :hub, folder: :nested_folder)
    |> customize_file_and_link()
  end

  test "registers every resource hub source adapter" do
    assert {:ok, Folder} = SourceRegistry.fetch("resource_hub_folder")
    assert {:ok, Document} = SourceRegistry.fetch("resource_hub_document")
    assert {:ok, File} = SourceRegistry.fetch("resource_hub_file")
    assert {:ok, Link} = SourceRegistry.fetch("resource_hub_link")
  end

  test "builds folder, document, file, and link entries with shared scope metadata", ctx do
    access_context = Access.get_context!(group_id: ctx.space.id)

    assert_entry(Folder, ctx.nested_folder.id, %{
      title: "nested_folder",
      body: "",
      body_kind: nil
    })

    assert_entry(Document, ctx.document.id, %{
      title: "Search handbook",
      body: "Document body",
      body_kind: "content"
    })

    assert_entry(File, ctx.resource_file.id, %{
      title: "Quarterly report.pdf",
      body: "File description",
      body_kind: "description"
    })

    assert_entry(Link, ctx.resource_link.id, %{
      title: "Research source",
      body: "Link description",
      body_kind: "description"
    })

    {:ok, [record]} = Document.fetch_by_ids([ctx.document.id])
    {:ok, attrs} = Document.to_entry(record)
    assert attrs.company_id == ctx.company.id
    assert attrs.access_context_id == access_context.id
    assert attrs.resource_hub_id == ctx.hub.id
    assert attrs.space_id == ctx.space.id
    assert attrs.project_id == nil
    assert attrs.goal_id == nil

    refute entry_attrs(Link, ctx.resource_link.id).body =~ ctx.resource_link.url
  end

  test "derives project and goal scope metadata", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_document(:project_document, :project_hub)
      |> Factory.add_document(:goal_document, :goal_hub)

    project_attrs = entry_attrs(Document, ctx.project_document.id)
    assert project_attrs.project_id == ctx.project.id
    assert project_attrs.space_id == ctx.space.id
    assert project_attrs.goal_id == nil
    assert project_attrs.access_context_id == Access.get_context!(project_id: ctx.project.id).id

    goal_attrs = entry_attrs(Document, ctx.goal_document.id)
    assert goal_attrs.goal_id == ctx.goal.id
    assert goal_attrs.space_id == ctx.space.id
    assert goal_attrs.project_id == nil
    assert goal_attrs.access_context_id == Access.get_context!(goal_id: ctx.goal.id).id
  end

  test "skips drafts, deleted nodes, and descendants of deleted folders", ctx do
    ctx = Factory.add_document(ctx, :draft, :hub, state: :draft)
    assert :skip = ctx.draft.id |> fetch_record(Document) |> Document.to_entry()

    node = Repo.get!(Node, ctx.resource_file.node_id)
    Repo.soft_delete!(node)
    assert :skip = ctx.resource_file.id |> fetch_record(File) |> File.to_entry()

    Repo.soft_delete!(ctx.parent_folder)
    assert :skip = ctx.document.id |> fetch_record(Document) |> Document.to_entry()
  end

  test "uses stable UUID keyset pagination", ctx do
    {:ok, first_page} = Folder.fetch_batch(nil, 1)
    assert length(first_page) == 1

    first_id = hd(first_page).id
    {:ok, remaining} = Folder.fetch_batch(first_id, 10)

    assert Enum.all?(remaining, &(&1.id > first_id))
    assert Enum.sort(Enum.map([hd(first_page) | remaining], & &1.id)) == Enum.map([hd(first_page) | remaining], & &1.id)
    assert Enum.any?(remaining, &(&1.id == ctx.parent_folder.id or &1.id == ctx.nested_folder.id))
  end

  test "uses the newest timestamp from every record contributing projected fields", ctx do
    newer_node_timestamp = NaiveDateTime.add(ctx.document.updated_at, 5, :second)
    newer_hub_timestamp = NaiveDateTime.add(ctx.document.updated_at, 10, :second)
    newer_parent_timestamp = NaiveDateTime.add(ctx.document.updated_at, 15, :second)
    newer_context_timestamp = NaiveDateTime.add(ctx.document.updated_at, 20, :second)

    Node
    |> Repo.get!(ctx.document.node_id)
    |> Ecto.Changeset.change(updated_at: newer_node_timestamp)
    |> Repo.update!()

    assert entry_attrs(Document, ctx.document.id).source_updated_at == newer_node_timestamp

    ctx.hub
    |> Ecto.Changeset.change(updated_at: newer_hub_timestamp)
    |> Repo.update!()

    assert entry_attrs(Document, ctx.document.id).source_updated_at == newer_hub_timestamp

    ctx.space
    |> Ecto.Changeset.change(updated_at: newer_parent_timestamp)
    |> Repo.update!()

    assert entry_attrs(Document, ctx.document.id).source_updated_at == newer_parent_timestamp

    Access.get_context!(group_id: ctx.space.id)
    |> Ecto.Changeset.change(updated_at: newer_context_timestamp)
    |> Repo.update!()

    assert entry_attrs(Document, ctx.document.id).source_updated_at == newer_context_timestamp
  end

  test "advances the source timestamp when a project moves to another space", ctx do
    ctx =
      ctx
      |> Factory.add_space(:destination_space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_document(:project_document, :project_hub)

    original_attrs = entry_attrs(Document, ctx.project_document.id)
    moved_at = NaiveDateTime.add(original_attrs.source_updated_at, 5, :second)

    ctx.project
    |> Project.changeset(%{group_id: ctx.destination_space.id})
    |> Ecto.Changeset.put_change(:updated_at, moved_at)
    |> Repo.update!()

    moved_attrs = entry_attrs(Document, ctx.project_document.id)
    assert moved_attrs.space_id == ctx.destination_space.id
    assert moved_attrs.source_updated_at == moved_at
  end

  test "fails closed for malformed records", ctx do
    document_record = fetch_record(ctx.document.id, Document)
    malformed_record = %{document_record | resource: %{document_record.resource | name: nil}}
    assert {:error, {:invalid, :missing_title}} = Document.to_entry(malformed_record)
  end

  defp customize_file_and_link(ctx) do
    file =
      ctx.resource_file
      |> ResourceFile.changeset(%{name: "Quarterly report.pdf", description: RichText.rich_text("File description")})
      |> Repo.update!()

    link =
      ctx.resource_link
      |> ResourceLink.changeset(%{
        name: "Research source",
        description: RichText.rich_text("Link description"),
        url: "https://private.example.test/secret",
        type: :other
      })
      |> Repo.update!()

    ctx |> Map.put(:resource_file, file) |> Map.put(:resource_link, link)
  end

  defp assert_entry(adapter, source_id, expected) do
    attrs = entry_attrs(adapter, source_id)
    Enum.each(expected, fn {field, value} -> assert Map.fetch!(attrs, field) == value end)
  end

  defp entry_attrs(adapter, source_id) do
    source_id |> fetch_record(adapter) |> adapter.to_entry() |> then(fn {:ok, attrs} -> attrs end)
  end

  defp fetch_record(source_id, adapter) do
    assert {:ok, [record]} = adapter.fetch_by_ids([source_id])
    record
  end
end
