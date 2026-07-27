defmodule Operately.Search.ResourceHubQueryTest do
  use Operately.DataCase

  alias Operately.Search
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx =
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_resource_hub(:hub, :space, :creator, name: "Knowledge Base")
      |> Factory.add_folder(:parent_folder, :hub)
      |> Factory.add_folder(:nested_folder, :hub, :parent_folder)
      |> Factory.add_document(:document, :hub,
        folder: :nested_folder,
        name: "Enterprise research",
        content: RichText.rich_text("Customer interviews revealed navigation problems")
      )
      |> Factory.add_file(:resource_file, :hub, folder: :nested_folder)
      |> Factory.add_link(:resource_link, :hub, folder: :nested_folder)
      |> rename_resource_hub_items()
      |> index_resource_hub_items()

    ctx
  end

  test "returns fully hydrated resource hub nodes", ctx do
    assert [document] = Search.search_resource_hub(ctx.hub, "navigation")
    assert document.type == :document
    assert document.document.id == ctx.document.id
    assert document.document.name == "Enterprise research"
    assert document.document.author.id == ctx.creator.id
    assert document.document.content == ctx.document.content
    assert document.document.comments_count == 0

    assert [file] = Search.search_resource_hub(ctx.hub, "Quarterly")
    assert file.type == :file
    assert file.file.id == ctx.resource_file.id

    assert [link] = Search.search_resource_hub(ctx.hub, "vendor")
    assert link.type == :link
    assert link.link.id == ctx.resource_link.id

    assert [folder] = Search.search_resource_hub(ctx.hub, "nested_folder")
    assert folder.type == :folder
    assert folder.folder.id == ctx.nested_folder.id
    assert folder.folder.children_count == 3
  end

  test "ranks exact titles, prefixes, title terms, and body matches in that order", ctx do
    ctx =
      ctx
      |> Factory.add_document(:exact, :hub, name: "Alpha", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:prefix, :hub, name: "Alpha strategy", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:title_term, :hub, name: "Roadmap alpha", content: RichText.rich_text("Unrelated"))
      |> Factory.add_document(:body_match, :hub, name: "Roadmap", content: RichText.rich_text("Alpha appears in this body"))

    Enum.each([ctx.exact, ctx.prefix, ctx.title_term, ctx.body_match], &sync(:document, &1.id))

    results = Search.search_resource_hub(ctx.hub, "alpha")
    result_ids = Enum.map(results, & &1.document.id)

    assert Enum.take(result_ids, 4) == [ctx.exact.id, ctx.prefix.id, ctx.title_term.id, ctx.body_match.id]
  end

  test "normalizes case and accents and accepts web-search phrases", ctx do
    ctx =
      Factory.add_document(ctx, :accented, :hub,
        name: "Café handbook",
        content: RichText.rich_text("European customer research archive")
      )

    sync(:document, ctx.accented.id)

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "CAFÉ")
    assert id == ctx.accented.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, ~s("customer research"))
    assert id == ctx.accented.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "customer -archive")
    assert id == ctx.document.id
  end

  test "matches word prefixes in titles and bodies while typing", ctx do
    ctx =
      Factory.add_document(ctx, :sentence, :hub,
        name: "Typing notes",
        content: RichText.rich_text("This is just a test")
      )

    sync(:document, ctx.sentence.id)

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "just a t")
    assert id == ctx.sentence.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "navig")
    assert id == ctx.document.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "Enterpri")
    assert id == ctx.document.id
  end

  test "matches structured lexemes in document bodies", ctx do
    ctx =
      Factory.add_document(ctx, :structured_lexemes, :hub,
        name: "Contact directory",
        content:
          RichText.rich_text(
            "Contact support@operately.com at example.com about version v1.2.3 or 3.14 on 2026-07-27 at 14:30. Read /docs/start or https://operately.com/docs/search about alpha-beta."
          )
      )

    sync(:document, ctx.structured_lexemes.id)

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
      assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, query)
      assert id == ctx.structured_lexemes.id
    end
  end

  test "preserves OR semantics with structured lexemes", ctx do
    ctx =
      Factory.add_document(ctx, :support, :hub,
        name: "Support directory",
        content: RichText.rich_text("Contact support@operately.com")
      )

    sync(:document, ctx.support.id)

    result_ids =
      ctx.hub
      |> Search.search_resource_hub("navigation OR support@operately.com")
      |> Enum.map(& &1.document.id)
      |> MapSet.new()

    assert result_ids == MapSet.new([ctx.document.id, ctx.support.id])
  end

  test "matches non-Latin word prefixes", ctx do
    ctx =
      Factory.add_document(ctx, :international, :hub,
        name: "International notes",
        content: RichText.rich_text("Навигационные заметки 東京計画")
      )

    sync(:document, ctx.international.id)

    for query <- ["Навигац", "東京"] do
      assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, query)
      assert id == ctx.international.id
    end
  end

  test "searches space-, project-, and goal-owned resource hubs", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.add_resource_hub(:project_hub, :project, :creator, name: "Project files")
      |> Factory.add_resource_hub(:goal_hub, :goal, :creator, name: "Goal files")
      |> Factory.add_document(:project_document, :project_hub, name: "Project-only marker")
      |> Factory.add_document(:goal_document, :goal_hub, name: "Goal-only marker")

    sync(:document, ctx.project_document.id)
    sync(:document, ctx.goal_document.id)

    assert [%{document: %{id: project_id}}] = Search.search_resource_hub(ctx.project_hub, "Project-only")

    assert project_id == ctx.project_document.id

    assert [%{document: %{id: goal_id}}] = Search.search_resource_hub(ctx.goal_hub, "Goal-only")

    assert goal_id == ctx.goal_document.id
  end

  test "excludes stale entries for drafts, deleted nodes, deleted ancestors, and missing resources", ctx do
    ctx =
      ctx
      |> Factory.add_document(:draft_after_index, :hub, name: "Hidden draft marker")
      |> Factory.add_document(:deleted_node, :hub, name: "Hidden node marker")
      |> Factory.add_document(:hidden_descendant, :hub, folder: :parent_folder, name: "Hidden descendant marker")
      |> Factory.add_folder(:missing_source, :hub)

    Enum.each([ctx.draft_after_index, ctx.deleted_node, ctx.hidden_descendant], &sync(:document, &1.id))
    sync(:folder, ctx.missing_source.id)

    ctx.draft_after_index
    |> Ecto.Changeset.change(state: :draft)
    |> Repo.update!()

    ctx.deleted_node
    |> Repo.preload(:node)
    |> Map.fetch!(:node)
    |> Repo.soft_delete!()

    Repo.soft_delete!(ctx.parent_folder)
    Repo.delete!(ctx.missing_source)

    for query <- ["Hidden draft", "Hidden node", "Hidden descendant", "missing_source"] do
      assert [] = Search.search_resource_hub(ctx.hub, query)
    end
  end

  test "limits results to 30 with a stable source-id tie breaker", ctx do
    documents =
      Enum.map(1..35, fn index ->
        document =
          Operately.ResourceHubsFixtures.document_fixture(ctx.hub.id, ctx.creator.id, %{
            name: "Common result #{index}",
            content: RichText.rich_text("Common")
          })

        sync(:document, document.id)
        document
      end)

    results = Search.search_resource_hub(ctx.hub, "Common")
    assert length(results) == 30

    expected_ids = documents |> Enum.map(& &1.id) |> Enum.sort() |> Enum.take(30)
    assert Enum.map(results, & &1.document.id) == expected_ids
  end

  test "treats title prefix metacharacters as literal characters", ctx do
    ctx =
      ctx
      |> Factory.add_document(:percent_title, :hub, name: "%% roadmap")
      |> Factory.add_document(:underscore_title, :hub, name: "__ notes")
      |> Factory.add_document(:backslash_title, :hub, name: ~S(\\archive))
      |> Factory.add_document(:escape_title, :hub, name: "!! priority")

    Enum.each([ctx.percent_title, ctx.underscore_title, ctx.backslash_title, ctx.escape_title], &sync(:document, &1.id))

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "%%")
    assert id == ctx.percent_title.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "__")
    assert id == ctx.underscore_title.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, ~S(\\))
    assert id == ctx.backslash_title.id

    assert [%{document: %{id: id}}] = Search.search_resource_hub(ctx.hub, "!!")
    assert id == ctx.escape_title.id
  end

  test "returns no results for short queries", ctx do
    assert [] = Search.search_resource_hub(ctx.hub, "a")
  end

  defp rename_resource_hub_items(ctx) do
    file =
      ctx.resource_file
      |> Operately.ResourceHubs.File.changeset(%{
        name: "Quarterly report",
        description: RichText.rich_text("Financial planning notes")
      })
      |> Repo.update!()

    link =
      ctx.resource_link
      |> Operately.ResourceHubs.Link.changeset(%{
        name: "Research provider",
        description: RichText.rich_text("External vendor assessment")
      })
      |> Repo.update!()

    %{ctx | resource_file: file, resource_link: link}
  end

  defp index_resource_hub_items(ctx) do
    sync(:folder, ctx.parent_folder.id)
    sync(:folder, ctx.nested_folder.id)
    sync(:document, ctx.document.id)
    sync(:file, ctx.resource_file.id)
    sync(:link, ctx.resource_link.id)
    ctx
  end

  defp sync(type, id) do
    source_type = Search.ResourceHubIndex.source_type(type)
    assert {:ok, _summary} = SourceIndexer.sync(source_type, id)
  end
end
