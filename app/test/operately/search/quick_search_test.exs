defmodule Operately.Search.QuickSearchTest do
  use Operately.DataCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Repo
  alias Operately.Search.QuickSearch
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Searchable Space")
    |> Factory.add_project(:project, :space, name: "Searchable Project")
    |> Factory.add_goal(:goal, :space, name: "Searchable Goal")
    |> Factory.add_project_milestone(:milestone, :project, title: "Searchable Milestone")
    |> Factory.add_project_task(:task, :milestone, name: "Searchable Task")
    |> Factory.add_company_member(:person, full_name: "Searchable Person", title: "Engineer")
    |> Factory.add_messages_board(:board, :space)
    |> Factory.add_message(:discussion, :board, title: "Searchable Discussion")
    |> Factory.add_resource_hub(:hub, :space, :creator)
    |> Factory.add_folder(:searchable_folder, :hub)
    |> Factory.add_document(:document, :hub, name: "Searchable Document")
    |> Factory.add_file(:resource_file, :hub)
    |> Factory.add_link(:resource_link, :hub)
    |> rename_resource_hub_items()
  end

  test "returns all supported title and name groups", ctx do
    results = QuickSearch.search(ctx.creator, "Searchable")

    assert Enum.map(results.spaces, & &1.id) == [ctx.space.id]
    assert Enum.map(results.projects, & &1.id) == [ctx.project.id]
    assert Enum.map(results.goals, & &1.id) == [ctx.goal.id]
    assert Enum.map(results.milestones, & &1.id) == [ctx.milestone.id]
    assert Enum.map(results.tasks, & &1.id) == [ctx.task.id]
    assert Enum.map(results.people, & &1.id) == [ctx.person.id]

    assert results.discussions == [
             %{id: ctx.discussion.id, title: "Searchable Discussion", context: "Searchable Space"}
           ]

    assert Enum.map(results.folders, & &1.id) == [ctx.searchable_folder.id]
    assert Enum.map(results.documents, & &1.id) == [ctx.document.id]
    assert Enum.map(results.files, & &1.id) == [ctx.resource_file.id]
    assert Enum.map(results.links, & &1.id) == [ctx.resource_link.id]
  end

  test "normalizes case, repeated whitespace, hyphens, and underscores", ctx do
    project =
      ctx.project
      |> Ecto.Changeset.change(name: "Re_establish   Search")
      |> Repo.update!()

    results = QuickSearch.search(ctx.creator, "RE-ESTABLISH search")

    assert Enum.map(results.projects, & &1.id) == [project.id]
  end

  test "does not match body content", ctx do
    project =
      ctx.project
      |> Ecto.Changeset.change(name: "Project", description: RichText.rich_text("Body-only marker"))
      |> Repo.update!()

    discussion =
      ctx.discussion
      |> Ecto.Changeset.change(title: "Discussion", body: RichText.rich_text("Body-only marker"))
      |> Repo.update!()

    document =
      ctx.document
      |> Ecto.Changeset.change(name: "Document", content: RichText.rich_text("Body-only marker"))
      |> Repo.update!()

    results = QuickSearch.search(ctx.creator, "Body-only marker")

    assert results.projects == []
    assert results.discussions == []
    assert results.documents == []
    assert project.description
    assert discussion.body
    assert document.content
  end

  test "returns the complete empty shape for short and invalid queries", ctx do
    expected = %{
      spaces: [],
      projects: [],
      goals: [],
      milestones: [],
      tasks: [],
      people: [],
      discussions: [],
      folders: [],
      documents: [],
      files: [],
      links: []
    }

    assert QuickSearch.search(ctx.creator, "a") == expected
    assert QuickSearch.search(ctx.creator, <<0, ?x>>) == expected
  end

  test "excludes unavailable work and discussions", ctx do
    ctx =
      ctx
      |> Factory.close_project(:project)
      |> Factory.close_goal(:goal)
      |> Factory.add_draft_message(:draft, :board, title: "Unavailable draft")
      |> Factory.add_message(:archived, :board, title: "Unavailable archived")

    Repo.soft_delete!(ctx.archived)

    assert QuickSearch.search(ctx.creator, "Searchable").projects == []
    assert QuickSearch.search(ctx.creator, "Searchable").goals == []
    assert QuickSearch.search(ctx.creator, "Searchable").milestones == []
    assert QuickSearch.search(ctx.creator, "Searchable").tasks == []
    assert QuickSearch.search(ctx.creator, "Unavailable").discussions == []
  end

  test "caps every canonical group at five results", ctx do
    ctx =
      Enum.reduce(1..6, ctx, fn index, acc ->
        acc
        |> Factory.add_space(String.to_atom("capped_space_#{index}"), name: "Capped Space #{index}")
        |> Factory.add_project(String.to_atom("capped_project_#{index}"), :space, name: "Capped Project #{index}")
        |> Factory.add_goal(String.to_atom("capped_goal_#{index}"), :space, name: "Capped Goal #{index}")
        |> Factory.add_project_milestone(String.to_atom("capped_milestone_#{index}"), :project, title: "Capped Milestone #{index}")
        |> Factory.add_project_task(String.to_atom("capped_task_#{index}"), :milestone, name: "Capped Task #{index}")
        |> Factory.add_company_member(String.to_atom("capped_person_#{index}"),
          full_name: "Capped Person #{index}"
        )
        |> Factory.add_message(String.to_atom("capped_discussion_#{index}"), :board, title: "Capped Discussion #{index}")
      end)

    results = QuickSearch.search(ctx.creator, "Capped")

    for group <- ~w(spaces projects goals milestones tasks people discussions)a do
      assert length(Map.fetch!(results, group)) == 5
    end
  end

  test "applies company isolation and live discussion permissions", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_space(:private_space,
        name: "Private Space",
        company_permissions: Binding.no_access()
      )
      |> Factory.add_messages_board(:private_board, :private_space)
      |> Factory.add_message(:private_discussion, :private_board, title: "Permission Marker")

    other =
      %{}
      |> Factory.setup()
      |> Factory.add_space(:other_space, name: "Other Space")
      |> Factory.add_messages_board(:other_board, :other_space)
      |> Factory.add_message(:other_discussion, :other_board, title: "Permission Marker")

    assert QuickSearch.search(ctx.viewer, "Permission Marker").discussions == []

    context = Access.get_context!(group_id: ctx.private_space.id)
    assert {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

    assert [%{id: discussion_id}] = QuickSearch.search(ctx.viewer, "Permission Marker").discussions
    assert discussion_id == ctx.private_discussion.id
    refute discussion_id == other.other_discussion.id

    assert {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)
    assert QuickSearch.search(ctx.viewer, "Permission Marker").discussions == []
  end

  defp rename_resource_hub_items(ctx) do
    file =
      ctx.resource_file
      |> Ecto.Changeset.change(name: "Searchable File")
      |> Repo.update!()

    link =
      ctx.resource_link
      |> Ecto.Changeset.change(name: "Searchable Link")
      |> Repo.update!()

    %{ctx | resource_file: file, resource_link: link}
  end
end
