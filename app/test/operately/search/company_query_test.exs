defmodule Operately.Search.CompanyQueryTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Search
  alias Operately.Search.{Entry, SourceIndexer}
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space, name: "Research Space")
      |> Factory.add_resource_hub(:hub, :space, :creator)
      |> Factory.add_folder(:folder, :hub)
      |> Factory.add_document(:document, :hub,
        folder: :folder,
        name: "Enterprise research",
        content: RichText.rich_text("Customer interviews revealed navigation problems")
      )
      |> Factory.add_file(:resource_file, :hub)
      |> Factory.add_link(:link, :hub)
      |> update_file_and_link()
      |> index_items()

    ctx
  end

  test "returns all resource hub types with owner context and typed navigation", ctx do
    assert [document] = Search.search_company(ctx.creator, "navigation")
    assert document.id == ctx.document.id
    assert document.type == :resource_hub_document
    assert document.title == "Enterprise research"
    assert document.context == "Research Space"
    assert document.matched_field == :content
    assert document.snippet =~ "navigation"
    refute document.snippet =~ "__OPERATELY_SEARCH"
    assert document.navigation_target == %{resource_hub_id: ctx.hub.id, document_id: ctx.document.id}

    assert [%{id: id, matched_field: :name, navigation_target: %{folder_id: folder_id}}] =
             Search.search_company(ctx.creator, "folder")

    assert id == ctx.folder.id
    assert folder_id == ctx.folder.id

    assert [%{id: id, matched_field: :description, navigation_target: %{file_id: file_id}}] =
             Search.search_company(ctx.creator, "financial")

    assert id == ctx.resource_file.id
    assert file_id == ctx.resource_file.id

    assert [%{id: id, matched_field: :description, navigation_target: %{link_id: link_id}}] =
             Search.search_company(ctx.creator, "vendor")

    assert id == ctx.link.id
    assert link_id == ctx.link.id
  end

  test "supports exact, prefix, title, body, phrase, exclusion, case, accents, and typed prefixes", ctx do
    ctx =
      ctx
      |> Factory.add_document(:exact, :hub, name: "Café", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:prefix, :hub, name: "Café strategy", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:title_term, :hub, name: "Roadmap café", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:body, :hub, name: "Roadmap", content: RichText.rich_text("Café customer archive"))

    Enum.each([ctx.exact, ctx.prefix, ctx.title_term, ctx.body], &sync(:document, &1.id))

    results = Search.search_company(ctx.creator, "CAFÉ")
    assert Enum.take(Enum.map(results, & &1.id), 4) == [ctx.exact.id, ctx.prefix.id, ctx.title_term.id, ctx.body.id]

    assert Enum.any?(Search.search_company(ctx.creator, "Enterpri"), &(&1.id == ctx.document.id))
    assert Enum.any?(Search.search_company(ctx.creator, ~s("customer interviews")), &(&1.id == ctx.document.id))
    assert Enum.any?(Search.search_company(ctx.creator, "customer -archive"), &(&1.id == ctx.document.id))

    or_result_ids = ctx.creator |> Search.search_company("navigation OR financial") |> Enum.map(& &1.id)
    assert ctx.document.id in or_result_ids
    assert ctx.resource_file.id in or_result_ids
  end

  test "uses current owner names without reindexing", ctx do
    ctx.space
    |> Operately.Groups.Group.changeset(%{name: "Renamed Space"})
    |> Repo.update!()

    assert [%{context: "Renamed Space"}] = Search.search_company(ctx.creator, "navigation")
  end

  test "uses the current project or goal name as context", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space, name: "Website Redesign")
      |> Factory.add_goal(:goal, :space, name: "European Expansion")
      |> Factory.add_resource_hub(:project_hub, :project, :creator)
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator)
      |> Factory.add_document(:project_document, :project_hub, name: "Project context marker")
      |> Factory.add_document(:goal_document, :goal_hub, name: "Goal context marker")

    sync(:document, ctx.project_document.id)
    sync(:document, ctx.goal_document.id)

    assert [%{context: "Website Redesign"}] = Search.search_company(ctx.creator, "Project context marker")
    assert [%{context: "European Expansion"}] = Search.search_company(ctx.creator, "Goal context marker")
  end

  test "applies live permissions and excludes suspended requesters", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_project(:private_project, :space,
        name: "Private",
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> Factory.add_resource_hub(:private_hub, :private_project, :creator)
      |> Factory.add_document(:private_document, :private_hub, name: "Private marker")

    sync(:document, ctx.private_document.id)
    context = Access.get_context!(project_id: ctx.private_project.id)
    {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

    assert [%{id: id}] = Search.search_company(ctx.viewer, "Private marker")
    assert id == ctx.private_document.id

    {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)
    assert [] = Search.search_company(ctx.viewer, "Private marker")

    suspended =
      ctx.creator
      |> Operately.People.Person.changeset(%{suspended: true, suspended_at: DateTime.utc_now()})
      |> Repo.update!()

    assert [] = Search.search_company(suspended, "navigation")
  end

  test "rejects stale projection metadata before ranking", ctx do
    other_context = Access.get_context!(company_id: ctx.company.id)

    Entry
    |> Repo.get_by!(source_type: :resource_hub_document, source_id: ctx.document.id)
    |> Ecto.Changeset.change(access_context_id: other_context.id)
    |> Repo.update!()

    assert [] = Search.search_company(ctx.creator, "navigation")
  end

  test "rejects stale hub, scope, and company metadata", ctx do
    ctx =
      ctx
      |> Factory.add_project(:other_project, :space)
      |> Factory.add_resource_hub(:other_hub, :other_project, :creator)
      |> Factory.add_document(:wrong_hub, :hub, name: "Wrong hub marker")
      |> Factory.add_document(:wrong_scope, :hub, name: "Wrong scope marker")
      |> Factory.add_document(:wrong_company, :hub, name: "Wrong company marker")
      |> Factory.add_company(:other_company, ctx.account, name: "Other Company")

    Enum.each([ctx.wrong_hub, ctx.wrong_scope, ctx.wrong_company], &sync(:document, &1.id))

    update_entry(ctx.wrong_hub, resource_hub_id: ctx.other_hub.id)
    update_entry(ctx.wrong_scope, project_id: ctx.other_project.id)
    update_entry(ctx.wrong_company, company_id: ctx.other_company.id)

    for query <- ["Wrong hub marker", "Wrong scope marker", "Wrong company marker"] do
      assert [] = Search.search_company(ctx.creator, query)
    end
  end

  test "does not return entries belonging to another company", ctx do
    ctx = Factory.add_company(ctx, :other_company, ctx.account, name: "Other Company")
    other_creator = Ecto.assoc(ctx.other_company, :people) |> Repo.all() |> hd()

    other_ctx =
      ctx
      |> Map.put(:company, ctx.other_company)
      |> Map.put(:creator, other_creator)
      |> Factory.add_space(:other_space, name: "Other Space")
      |> Factory.add_resource_hub(:other_company_hub, :other_space, :creator)
      |> Factory.add_document(:other_document, :other_company_hub, name: "Foreign company marker")

    sync(:document, other_ctx.other_document.id)

    assert [] = Search.search_company(ctx.creator, "Foreign company marker")
  end

  test "excludes drafts, deleted nodes, deleted ancestors, and missing records", ctx do
    draft = Factory.add_document(ctx, :draft, :hub, name: "Draft marker").draft
    deleted_node = Factory.add_document(ctx, :deleted_node, :hub, name: "Node marker").deleted_node
    hidden = Factory.add_document(ctx, :hidden, :hub, folder: :folder, name: "Ancestor marker").hidden
    missing = Factory.add_document(ctx, :missing, :hub, name: "Missing marker").missing

    Enum.each([draft, deleted_node, hidden, missing], &sync(:document, &1.id))

    draft |> Ecto.Changeset.change(state: :draft) |> Repo.update!()
    deleted_node |> Repo.preload(:node) |> Map.fetch!(:node) |> Repo.soft_delete!()
    Repo.soft_delete!(ctx.folder)
    Repo.delete!(missing)

    for query <- ["Draft marker", "Node marker", "Ancestor marker", "Missing marker"] do
      assert [] = Search.search_company(ctx.creator, query)
    end
  end

  test "returns at most 30 results with a stable source-id tie breaker", ctx do
    documents =
      Enum.map(1..35, fn index ->
        document =
          Operately.ResourceHubsFixtures.document_fixture(ctx.hub.id, ctx.creator.id, %{
            name: "Common result #{index}",
            content: RichText.rich_text("Unrelated")
          })

        sync(:document, document.id)
        document
      end)

    results = Search.search_company(ctx.creator, "Common")
    assert length(results) == 30

    expected_ids = documents |> Enum.map(& &1.id) |> Enum.sort() |> Enum.take(30)
    assert Enum.map(results, & &1.id) == expected_ids
  end

  test "carries indexed state and returns nothing for short queries", ctx do
    Entry
    |> Repo.get_by!(source_type: :resource_hub_document, source_id: ctx.document.id)
    |> Ecto.Changeset.change(state: :archived)
    |> Repo.update!()

    assert [%{state: :archived}] = Search.search_company(ctx.creator, "navigation")
    assert [] = Search.search_company(ctx.creator, "a")
  end

  defp update_file_and_link(ctx) do
    file =
      ctx.resource_file
      |> Operately.ResourceHubs.File.changeset(%{
        name: "Quarterly report",
        description: RichText.rich_text("Financial planning notes")
      })
      |> Repo.update!()

    link =
      ctx.link
      |> Operately.ResourceHubs.Link.changeset(%{
        name: "Research provider",
        description: RichText.rich_text("External vendor assessment")
      })
      |> Repo.update!()

    %{ctx | resource_file: file, link: link}
  end

  defp index_items(ctx) do
    sync(:folder, ctx.folder.id)
    sync(:document, ctx.document.id)
    sync(:file, ctx.resource_file.id)
    sync(:link, ctx.link.id)
    ctx
  end

  defp sync(type, id) do
    source_type = Search.ResourceHubIndex.source_type(type)
    assert {:ok, _summary} = SourceIndexer.sync(source_type, id)
  end

  defp update_entry(resource, attrs) do
    Entry
    |> Repo.get_by!(source_type: :resource_hub_document, source_id: resource.id)
    |> Ecto.Changeset.change(attrs)
    |> Repo.update!()
  end
end
