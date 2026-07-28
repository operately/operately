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

  test "returns projects, goals, and discussions with semantic matches and typed navigation", ctx do
    ctx =
      ctx
      |> Factory.add_project(:search_project, :space, name: "Website roadmap")
      |> Factory.add_goal(:search_goal, :space, name: "Expansion goal")
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:discussion, :board,
        title: "Customer research",
        body: RichText.rich_text("Interview synthesis")
      )

    project =
      ctx.search_project
      |> Operately.Projects.Project.changeset(%{description: RichText.rich_text("Navigation evidence")})
      |> Repo.update!()

    goal =
      ctx.search_goal
      |> Operately.Goals.Goal.changeset(%{description: RichText.rich_text("Market evidence")})
      |> Repo.update!()

    sync(:project, project.id)
    sync(:goal, goal.id)
    sync(:discussion, ctx.discussion.id)

    assert [%{id: id, context: "Research Space", matched_field: :description, navigation_target: %{project_id: project_id}}] =
             Search.search_company(ctx.creator, "Navigation evidence")

    assert id == project.id
    assert project_id == project.id

    assert [%{id: id, matched_field: :name, navigation_target: %{goal_id: goal_id}}] =
             Search.search_company(ctx.creator, "Expansion goal")

    assert id == goal.id
    assert goal_id == goal.id

    assert [%{id: id, matched_field: :content, snippet: snippet, navigation_target: %{discussion_id: discussion_id}}] =
             Search.search_company(ctx.creator, "Interview synthesis")

    assert id == ctx.discussion.id
    assert discussion_id == ctx.discussion.id
    assert snippet =~ "Interview synthesis"
  end

  test "includes current historical core work states and excludes ineligible core work", ctx do
    ctx =
      ctx
      |> Factory.add_project(:paused_project, :space, name: "Paused marker")
      |> Factory.add_project(:archived_project, :space, name: "Archived marker")
      |> Factory.add_goal(:closed_goal, :space, name: "Closed marker")
      |> Factory.add_goal(:deleted_goal, :space, name: "Deleted marker")
      |> Factory.add_messages_board(:board, :space)
      |> Factory.add_message(:archived_discussion, :board, title: "Archived discussion marker")
      |> Factory.add_message(:draft_discussion, :board, title: "Draft marker", state: :draft)

    ctx.paused_project |> Ecto.Changeset.change(status: "paused") |> Repo.update!()
    Repo.soft_delete!(ctx.archived_project)
    ctx.closed_goal |> Ecto.Changeset.change(closed_at: DateTime.utc_now(:second)) |> Repo.update!()
    Repo.soft_delete!(ctx.deleted_goal)
    Repo.soft_delete!(ctx.archived_discussion)

    Enum.each(
      [
        {:project, ctx.paused_project.id},
        {:project, ctx.archived_project.id},
        {:goal, ctx.closed_goal.id},
        {:goal, ctx.deleted_goal.id},
        {:discussion, ctx.archived_discussion.id},
        {:discussion, ctx.draft_discussion.id}
      ],
      fn {type, id} -> sync(type, id) end
    )

    assert [%{state: :paused}] = Search.search_company(ctx.creator, "Paused marker")
    assert Enum.any?(Search.search_company(ctx.creator, "Archived marker"), &(&1.id == ctx.archived_project.id and &1.state == :archived))
    assert [%{state: :closed}] = Search.search_company(ctx.creator, "Closed marker")
    assert [%{state: :archived}] = Search.search_company(ctx.creator, "Archived discussion marker")
    assert [] = Search.search_company(ctx.creator, "Deleted marker")
    assert [] = Search.search_company(ctx.creator, "Draft marker")
  end

  test "applies live core-work permissions and rejects stale scope metadata", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_space(:other_space)
      |> Factory.add_project(:private_project, :space,
        name: "Private project marker",
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )

    sync(:project, ctx.private_project.id)
    context = Access.get_context!(project_id: ctx.private_project.id)

    assert [] = Search.search_company(ctx.viewer, "Private project marker")
    {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())
    assert [%{id: id}] = Search.search_company(ctx.viewer, "Private project marker")
    assert id == ctx.private_project.id

    Entry
    |> Repo.get_by!(source_type: :project, source_id: ctx.private_project.id)
    |> Ecto.Changeset.change(space_id: ctx.other_space.id)
    |> Repo.update!()

    assert [] = Search.search_company(ctx.viewer, "Private project marker")
  end

  test "supports exact, prefix, title, body, phrase, unary-minus punctuation, case, accents, and typed prefixes", ctx do
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
    minus_result_ids = ctx.creator |> Search.search_company("customer -archive") |> Enum.map(& &1.id)
    assert ctx.body.id in minus_result_ids
    refute ctx.document.id in minus_result_ids

    or_result_ids = ctx.creator |> Search.search_company("navigation OR financial") |> Enum.map(& &1.id)
    assert ctx.document.id in or_result_ids
    assert ctx.resource_file.id in or_result_ids
  end

  test "does not match quoted phrases across the title and body boundary", ctx do
    ctx =
      ctx
      |> Factory.add_document(:split_phrase, :hub,
        name: "Boundary customer",
        content: RichText.rich_text("research archive")
      )
      |> Factory.add_document(:title_phrase, :hub,
        name: "Customer research findings",
        content: RichText.rich_text("archive evidence")
      )

    sync(:document, ctx.split_phrase.id)
    sync(:document, ctx.title_phrase.id)

    results = Search.search_company(ctx.creator, ~s("customer research"))
    result_ids = Enum.map(results, & &1.id)

    assert ctx.title_phrase.id in result_ids
    refute ctx.split_phrase.id in result_ids

    assert [%{id: mixed_id}] = Search.search_company(ctx.creator, ~s("customer research" archive))
    assert mixed_id == ctx.title_phrase.id

    or_result_ids =
      ctx.creator
      |> Search.search_company(~s("customer research" OR navigation))
      |> Enum.map(& &1.id)

    assert ctx.title_phrase.id in or_result_ids
    assert ctx.document.id in or_result_ids
  end

  test "does not admit phrase or OR syntax through literal title-prefix matching", ctx do
    ctx =
      ctx
      |> Factory.add_document(:quoted_punctuation, :hub, name: ~s("%%" literal title))
      |> Factory.add_document(:or_punctuation, :hub, name: "%% OR __ literal title")

    sync(:document, ctx.quoted_punctuation.id)
    sync(:document, ctx.or_punctuation.id)

    assert [] = Search.search_company(ctx.creator, ~s("%%"))
    assert [] = Search.search_company(ctx.creator, "%% OR __")
  end

  test "matches structured lexemes and preserves OR semantics", ctx do
    ctx =
      ctx
      |> Factory.add_document(:structured, :hub,
        name: "Contact directory",
        content:
          RichText.rich_text(
            "Contact support@operately.com at example.com about version v1.2.3 or 3.14 on 2026-07-27 at 14:30. Read /docs/start or https://operately.com/docs/search about alpha-beta."
          )
      )
      |> Factory.add_document(:alternative, :hub,
        name: "Navigation alternative",
        content: RichText.rich_text("Fallback marker")
      )

    sync(:document, ctx.structured.id)
    sync(:document, ctx.alternative.id)

    for query <- [
          "support@operately.com",
          "example.com",
          "3.14",
          "2026-07-27",
          "14:30",
          "v1.2.3",
          "/docs/start",
          "alpha-beta",
          "contact support@operately.com",
          "https://operately.com/docs/search"
        ] do
      assert Enum.any?(Search.search_company(ctx.creator, query), &(&1.id == ctx.structured.id))
    end

    result_ids =
      ctx.creator
      |> Search.search_company("navigation OR support@operately.com")
      |> Enum.map(& &1.id)

    assert ctx.document.id in result_ids
    assert ctx.structured.id in result_ids
  end

  test "matches non-Latin word prefixes", ctx do
    ctx =
      Factory.add_document(ctx, :international, :hub,
        name: "International notes",
        content: RichText.rich_text("Навигационные заметки 東京計画")
      )

    sync(:document, ctx.international.id)

    for query <- ["Навигац", "東京"] do
      assert Enum.any?(Search.search_company(ctx.creator, query), &(&1.id == ctx.international.id))
    end
  end

  test "treats title prefix metacharacters as literal characters", ctx do
    ctx =
      ctx
      |> Factory.add_document(:percent_title, :hub, name: "%% roadmap")
      |> Factory.add_document(:underscore_title, :hub, name: "__ notes")
      |> Factory.add_document(:backslash_title, :hub, name: ~S(\\archive))
      |> Factory.add_document(:escape_title, :hub, name: "!! priority")

    Enum.each([ctx.percent_title, ctx.underscore_title, ctx.backslash_title, ctx.escape_title], &sync(:document, &1.id))

    assert [%{id: percent_id}] = Search.search_company(ctx.creator, "%%")
    assert percent_id == ctx.percent_title.id

    assert [%{id: underscore_id}] = Search.search_company(ctx.creator, "__")
    assert underscore_id == ctx.underscore_title.id

    assert [%{id: backslash_id}] = Search.search_company(ctx.creator, ~S(\\))
    assert backslash_id == ctx.backslash_title.id

    assert [%{id: escape_id}] = Search.search_company(ctx.creator, "!!")
    assert escape_id == ctx.escape_title.id
  end

  test "keeps title matches ahead of bodies with many repeated matches", ctx do
    repeated_body = Enum.join(List.duplicate("signal", 20), " ")

    ctx =
      ctx
      |> Factory.add_document(:title_match, :hub, name: "Roadmap signal", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:body_match, :hub, name: "Evidence archive", content: RichText.rich_text(repeated_body))

    sync(:document, ctx.title_match.id)
    sync(:document, ctx.body_match.id)

    assert [title_match, body_match] = Search.search_company(ctx.creator, "signal")
    assert title_match.id == ctx.title_match.id
    assert title_match.matched_field == :title
    assert body_match.id == ctx.body_match.id
    assert body_match.matched_field == :content
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

  test "returns no results for oversized queries", ctx do
    oversized_query = Enum.map_join(1..20_000, " ", &"query#{&1}")

    assert [] = Search.search_company(ctx.creator, oversized_query)
  end

  test "returns no results for PostgreSQL-invalid query text", ctx do
    assert [] = Search.search_company(ctx.creator, <<0, ?x>>)
    assert [] = Search.search_company(ctx.creator, <<255, 255>>)
  end

  test "ranks with the stored search vector and builds snippets only for body matches", ctx do
    sql = capture_search_sql(fn -> Search.search_company(ctx.creator, "navigation") end)
    [_query, order_by] = String.split(sql, " ORDER BY ", parts: 2)

    assert order_by =~ "ARRAY[0.0,0.0,0.0,1.0]::real[]"
    assert order_by =~ "ARRAY[0.0,0.0,1.0,0.0]::real[]"
    assert order_by =~ ~r/::real\[\], [^,]+\."search_vector"/
    refute order_by =~ "ts_rank_cd(to_tsvector"
    assert sql =~ "THEN NULL ELSE ts_headline"
    assert sql =~ ~s("company_search_candidates" AS MATERIALIZED)
    assert sql =~ ~s("company_search_candidate_ancestors")
    refute sql =~ "visible_company_search_nodes"
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
    source_type =
      case type do
        type when type in [:project, :goal, :discussion] -> Atom.to_string(type)
        resource_hub_type -> Search.ResourceHubIndex.source_type(resource_hub_type)
      end

    assert {:ok, _summary} = SourceIndexer.sync(source_type, id)
  end

  defp update_entry(resource, attrs) do
    Entry
    |> Repo.get_by!(source_type: :resource_hub_document, source_id: resource.id)
    |> Ecto.Changeset.change(attrs)
    |> Repo.update!()
  end

  defp capture_search_sql(search) do
    handler_id = {__MODULE__, self(), make_ref()}
    test_pid = self()

    :telemetry.attach(
      handler_id,
      [:operately, :repo, :query],
      fn _event, _measurements, metadata, owner ->
        if self() == owner, do: send(owner, {handler_id, metadata.query})
      end,
      test_pid
    )

    try do
      search.()
      assert_receive {^handler_id, sql}
      sql
    after
      :telemetry.detach(handler_id)
    end
  end
end
