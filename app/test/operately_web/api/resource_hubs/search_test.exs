defmodule OperatelyWeb.Api.ResourceHubs.SearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access.Binding
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space)
    |> Factory.add_resource_hub(:hub, :space, :creator, name: "Knowledge Base")
    |> Factory.add_folder(:folder, :hub)
    |> Factory.add_document(:document, :hub,
      folder: :folder,
      name: "Searchable document",
      content: RichText.rich_text("Distinctive searchable content")
    )
    |> Factory.add_file(:resource_file, :hub, folder: :folder)
    |> Factory.add_link(:resource_link, :hub, folder: :folder)
    |> rename_items()
    |> index_results()
  end

  test "requires authentication", ctx do
    assert {401, _} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               query: "searchable"
             })
  end

  test "returns fully hydrated resource hub nodes", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{nodes: [node]}} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               query: "content"
             })

    assert node.type == "document"
    assert node.name == "Searchable document"
    assert node.document.id == Paths.document_id(ctx.document)
    assert node.document.name == "Searchable document"
    assert node.document.author.id == Paths.person_id(ctx.creator)
    assert node.document.content =~ "Distinctive searchable content"
    assert node.document.comments_count == 0
  end

  test "returns every resource type using the same node shape as list_nodes", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{nodes: nodes}} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               query: "Searchable"
             })

    assert Enum.find(nodes, &(&1[:folder] && &1.folder.id == Paths.folder_id(ctx.folder)))
    assert Enum.find(nodes, &(&1[:document] && &1.document.id == Paths.document_id(ctx.document)))
    assert Enum.find(nodes, &(&1[:file] && &1.file.id == Paths.file_id(ctx.resource_file)))
    assert Enum.find(nodes, &(&1[:link] && &1.link.id == Paths.link_id(ctx.resource_link)))

    folder_node = Enum.find(nodes, & &1[:folder])
    assert folder_node.folder.children_count == 3
  end

  test "returns empty results for short queries after authorizing the hub", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{nodes: []}} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               query: "a"
             })
  end

  test "returns empty results for PostgreSQL-invalid query text", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{nodes: []}} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(ctx.hub),
               query: <<0, ?x>>
             })
  end

  test "does not reveal inaccessible or cross-company resource hubs", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:member)
      |> Factory.log_in_person(:member)

    hidden_space =
      Operately.GroupsFixtures.group_fixture(ctx.creator, %{
        company_id: ctx.company.id,
        company_permissions: Binding.no_access()
      })

    hidden_hub = Operately.ResourceHubsFixtures.resource_hub_fixture(ctx.creator, hidden_space)
    other_company = Operately.CompaniesFixtures.company_fixture(%{company_name: "Other company"})
    other_creator = other_company |> Ecto.assoc(:people) |> Repo.one!()
    other_space = Operately.GroupsFixtures.group_fixture(other_creator)
    other_hub = Operately.ResourceHubsFixtures.resource_hub_fixture(other_creator, other_space)

    assert {404, _} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(hidden_hub),
               query: "searchable"
             })

    assert {404, _} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(other_hub),
               query: "a"
             })

    assert {404, _} =
             query(ctx.conn, [:resource_hubs, :search], %{
               resource_hub_id: Paths.resource_hub_id(Ecto.UUID.generate()),
               query: "a"
             })
  end

  defp index_results(ctx) do
    assert {:ok, _} = SourceIndexer.sync("resource_hub_folder", ctx.folder.id)
    assert {:ok, _} = SourceIndexer.sync("resource_hub_document", ctx.document.id)
    assert {:ok, _} = SourceIndexer.sync("resource_hub_file", ctx.resource_file.id)
    assert {:ok, _} = SourceIndexer.sync("resource_hub_link", ctx.resource_link.id)
    ctx
  end

  defp rename_items(ctx) do
    folder =
      ctx.folder
      |> Operately.ResourceHubs.Folder.changeset(%{name: "Searchable folder"})
      |> Repo.update!()

    file =
      ctx.resource_file
      |> Operately.ResourceHubs.File.changeset(%{
        name: "Searchable file",
        description: RichText.rich_text("File description")
      })
      |> Repo.update!()

    link =
      ctx.resource_link
      |> Operately.ResourceHubs.Link.changeset(%{
        name: "Searchable link",
        description: RichText.rich_text("Link description")
      })
      |> Repo.update!()

    %{ctx | folder: folder, resource_file: file, resource_link: link}
  end
end
