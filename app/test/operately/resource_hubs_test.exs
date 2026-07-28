defmodule Operately.ResourceHubsTest do
  use Operately.DataCase

  alias Operately.ResourceHubs

  describe "count_visible_docs_and_files/2" do
    setup ctx do
      ctx
      |> Factory.setup()
      |> Factory.add_space(:space)
      |> Factory.add_space_member(:other_member, :space)
      |> Factory.add_project(:project, :space)
      |> Factory.add_goal(:goal, :space)
      |> Factory.fetch_default_project_resource_hub(:project_hub, :project)
      |> Factory.fetch_default_goal_resource_hub(:goal_hub, :goal)
      |> then(&{:ok, &1})
    end

    test "counts published docs, files, and links and excludes folders for a project", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:folder, :project_hub)
        |> Factory.add_document(:doc, :project_hub)
        |> Factory.add_file(:file, :project_hub)
        |> Factory.add_link(:link, :project_hub)
        |> Factory.add_document(:nested_doc, :project_hub, folder: :folder)

      assert ResourceHubs.count_visible_docs_and_files(ctx.project, ctx.creator) == 4
    end

    test "counts published docs, files, and links and excludes folders for a goal", ctx do
      ctx =
        ctx
        |> Factory.add_folder(:folder, :goal_hub)
        |> Factory.add_document(:doc, :goal_hub)
        |> Factory.add_file(:file, :goal_hub)
        |> Factory.add_link(:link, :goal_hub)
        |> Factory.add_document(:nested_doc, :goal_hub, folder: :folder)

      assert ResourceHubs.count_visible_docs_and_files(ctx.goal, ctx.creator) == 4
    end

    test "includes the viewer's own draft documents", ctx do
      ctx =
        ctx
        |> Factory.add_document(:published, :project_hub)
        |> Factory.add_document(:own_draft, :project_hub, state: :draft)

      assert ResourceHubs.count_visible_docs_and_files(ctx.project, ctx.creator) == 2
    end

    test "excludes draft documents authored by someone else", ctx do
      ctx =
        ctx
        |> Factory.add_document(:published, :project_hub)
        |> Factory.add_document(:own_draft, :project_hub, state: :draft)
        |> Factory.add_document(:other_draft, :project_hub, author: :other_member, state: :draft)

      assert ResourceHubs.count_visible_docs_and_files(ctx.project, ctx.creator) == 2
      assert ResourceHubs.count_visible_docs_and_files(ctx.project, ctx.other_member) == 2
    end

    test "excludes all drafts when the viewer has none", ctx do
      ctx =
        ctx
        |> Factory.add_document(:published, :goal_hub)
        |> Factory.add_document(:creator_draft, :goal_hub, state: :draft)
        |> Factory.add_file(:file, :goal_hub)

      assert ResourceHubs.count_visible_docs_and_files(ctx.goal, ctx.other_member) == 2
    end
  end
end
