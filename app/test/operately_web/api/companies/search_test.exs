defmodule OperatelyWeb.Api.Companies.SearchTest do
  use OperatelyWeb.TurboCase

  alias Operately.Access
  alias Operately.Access.Binding
  alias Operately.Projects.Project
  alias Operately.Repo
  alias Operately.Search.SourceIndexer
  alias Operately.Support.{Factory, RichText}

  setup ctx do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:space, name: "Product Space")
  end

  test "requires authentication", ctx do
    assert {401, _} = query(ctx.conn, [:companies, :search], query: "customer evidence")
  end

  test "returns empty results for short, blank, malformed, and oversized queries", ctx do
    ctx = Factory.log_in_person(ctx, :creator)

    for search_query <- ["a", "   ", <<0, ?x>>, String.duplicate("query ", 101)] do
      assert {200, %{results: []}} =
               query(ctx.conn, [:companies, :search], query: search_query)
    end
  end

  test "returns ordered title and body matches with full metadata", ctx do
    ctx =
      ctx
      |> Factory.add_project(:title_match, :space, name: "Signal roadmap")
      |> Factory.add_project(:body_match, :space, name: "Website redesign")
      |> update_project_description(:body_match, "Signal evidence from customer interviews")
      |> Factory.close_project(:body_match)
      |> index_project(:title_match)
      |> index_project(:body_match)
      |> Factory.log_in_person(:creator)

    assert {200, %{results: [title_match, body_match]}} =
             query(ctx.conn, [:companies, :search], query: "Signal")

    assert title_match == %{
             __typename: "result",
             id: Operately.ShortUuid.encode!(ctx.title_match.id),
             type: "project",
             title: "Signal roadmap",
             context: "Product Space",
             matched_field: "name",
             snippet: nil,
             state: nil,
             navigation_target: %{
               resource_hub_id: nil,
               folder_id: nil,
               document_id: nil,
               file_id: nil,
               link_id: nil,
               project_id: Operately.ShortUuid.encode!(ctx.title_match.id),
               goal_id: nil,
               milestone_id: nil,
               task_id: nil,
               person_id: nil,
               discussion_id: nil,
               project_check_in_id: nil,
               goal_check_in_id: nil,
               project_retrospective_id: nil
             }
           }

    assert body_match.id == Operately.ShortUuid.encode!(ctx.body_match.id)
    assert body_match.type == "project"
    assert body_match.title == "Website redesign"
    assert body_match.context == "Product Space"
    assert body_match.matched_field == "description"
    assert body_match.state == "closed"
    assert body_match.navigation_target.project_id == Operately.ShortUuid.encode!(ctx.body_match.id)
    assert body_match.snippet =~ "Signal evidence"
    refute body_match.snippet =~ "__OPERATELY_SEARCH"
  end

  test "applies live permission grants and revocations", ctx do
    ctx =
      ctx
      |> Factory.add_company_member(:viewer)
      |> Factory.add_project(:private_project, :space,
        name: "Private project",
        company_access_level: Binding.no_access(),
        space_access_level: Binding.no_access()
      )
      |> update_project_description(:private_project, "Confidential acquisition marker")
      |> index_project(:private_project)
      |> Factory.log_in_person(:viewer)

    assert {200, %{results: []}} =
             query(ctx.conn, [:companies, :search], query: "Confidential acquisition marker")

    context = Access.get_context!(project_id: ctx.private_project.id)
    assert {:ok, _binding} = Access.bind(context, person_id: ctx.viewer.id, level: Binding.view_access())

    assert {200, %{results: [%{id: result_id}]}} =
             query(ctx.conn, [:companies, :search], query: "Confidential acquisition marker")

    assert result_id == Operately.ShortUuid.encode!(ctx.private_project.id)
    assert {:ok, _binding} = Access.unbind(context, person_id: ctx.viewer.id)

    assert {200, %{results: []}} =
             query(ctx.conn, [:companies, :search], query: "Confidential acquisition marker")
  end

  test "serializes milestone, task, and person search results", ctx do
    ctx =
      ctx
      |> Factory.add_project(:project, :space, name: "Expansion program")
      |> Factory.add_project_milestone(:milestone, :project, title: "Launch marker")
      |> Factory.add_project_task(:task, :milestone, name: "Interview marker")
      |> Factory.add_company_member(:teammate, name: "Taylor Marker", title: "Product strategist")

    assert {:ok, _} = SourceIndexer.sync("milestone", ctx.milestone.id)
    assert {:ok, _} = SourceIndexer.sync("task", ctx.task.id)
    assert {:ok, _} = SourceIndexer.sync("person", ctx.teammate.id)
    ctx = Factory.log_in_person(ctx, :creator)

    assert {200, %{results: [%{type: "milestone", matched_field: "title", navigation_target: milestone_target}]}} =
             query(ctx.conn, [:companies, :search], query: "Launch marker")

    assert milestone_target.milestone_id == Operately.ShortUuid.encode!(ctx.milestone.id)

    assert {200, %{results: [%{type: "task", matched_field: "name", navigation_target: task_target}]}} =
             query(ctx.conn, [:companies, :search], query: "Interview marker")

    assert task_target.task_id == Operately.ShortUuid.encode!(ctx.task.id)

    assert {200, %{results: [%{type: "person", matched_field: "title", navigation_target: person_target}]}} =
             query(ctx.conn, [:companies, :search], query: "Product strategist")

    assert person_target.person_id == Operately.ShortUuid.encode!(ctx.teammate.id)
  end

  defp update_project_description(ctx, project_name, description) do
    project =
      ctx
      |> Map.fetch!(project_name)
      |> Project.changeset(%{description: RichText.rich_text(description)})
      |> Repo.update!()

    Map.put(ctx, project_name, project)
  end

  defp index_project(ctx, project_name) do
    project = Map.fetch!(ctx, project_name)
    assert {:ok, _summary} = SourceIndexer.sync("project", project.id)
    ctx
  end
end
