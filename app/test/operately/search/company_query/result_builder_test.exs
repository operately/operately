defmodule Operately.Search.CompanyQuery.ResultBuilderTest do
  use ExUnit.Case, async: true

  alias Operately.Search.CompanyQuery.ResultBuilder
  alias Operately.Search.Result

  test "builds title and body matches with typed navigation targets" do
    document_id = Ecto.UUID.generate()
    file_id = Ecto.UUID.generate()
    hub_id = Ecto.UUID.generate()

    candidates = [
      candidate(%{
        source_id: document_id,
        source_type: :resource_hub_document,
        resource_hub_id: hub_id,
        exact_title: true,
        body: "Customer interviews revealed navigation problems",
        body_snippet: "Customer interviews revealed navigation problems",
        state: :archived
      }),
      candidate(%{
        source_id: file_id,
        source_type: :resource_hub_file,
        resource_hub_id: hub_id,
        title: "Research.pdf",
        body_kind: "description",
        body: "customer evidence and more notes from the research team",
        body_snippet: "__OPERATELY_SEARCH_START__customer__OPERATELY_SEARCH_STOP__ evidence"
      })
    ]

    assert [
             %Result{
               id: ^document_id,
               type: :resource_hub_document,
               matched_field: :title,
               snippet: "Customer interviews revealed navigation problems",
               state: :archived,
               navigation_target: %{resource_hub_id: ^hub_id, document_id: ^document_id}
             },
             %Result{
               id: ^file_id,
               type: :resource_hub_file,
               matched_field: :description,
               snippet: "customer evidence...",
               navigation_target: %{resource_hub_id: ^hub_id, file_id: ^file_id}
             }
           ] = ResultBuilder.build(candidates)
  end

  test "keeps person name matches snippet-free and omits blank body excerpts" do
    person =
      ResultBuilder.build_one(
        candidate(%{
          source_type: :person,
          exact_title: true,
          body_kind: "title",
          body: "VP of Product",
          body_snippet: "VP of Product"
        })
      )

    empty_body =
      ResultBuilder.build_one(
        candidate(%{
          source_type: :project,
          exact_title: true,
          body_kind: "description",
          body: "",
          body_snippet: "   "
        })
      )

    assert person.matched_field == :name
    assert person.snippet == nil
    assert empty_body.snippet == nil
  end

  test "appends an ellipsis when the excerpt is shorter than the body" do
    truncated =
      ResultBuilder.build_one(
        candidate(%{
          body: "Customer interviews revealed navigation problems across the checkout flow",
          body_snippet: "Customer interviews revealed navigation problems"
        })
      )

    complete =
      ResultBuilder.build_one(
        candidate(%{
          body: "Customer interviews revealed navigation problems",
          body_snippet: "Customer interviews revealed navigation problems"
        })
      )

    assert truncated.snippet == "Customer interviews revealed navigation problems..."
    assert complete.snippet == "Customer interviews revealed navigation problems"
  end

  test "uses semantic title fields for every resource hub type" do
    assert ResultBuilder.build_one(candidate(%{source_type: :resource_hub_folder, exact_title: true})).matched_field == :name
    assert ResultBuilder.build_one(candidate(%{source_type: :resource_hub_document, exact_title: true})).matched_field == :title
    assert ResultBuilder.build_one(candidate(%{source_type: :resource_hub_file, exact_title: true})).matched_field == :name
    assert ResultBuilder.build_one(candidate(%{source_type: :resource_hub_link, exact_title: true})).matched_field == :name
    assert ResultBuilder.build_one(candidate(%{body_kind: "content"})).matched_field == :content
  end

  test "builds semantic matches and navigation for core work" do
    project = ResultBuilder.build_one(candidate(%{source_type: :project, exact_title: true}))
    goal = ResultBuilder.build_one(candidate(%{source_type: :goal, body_kind: "description"}))
    discussion = ResultBuilder.build_one(candidate(%{source_type: :discussion, exact_title: true}))

    assert project.matched_field == :name
    assert project.navigation_target == %{project_id: project.id}
    assert goal.matched_field == :description
    assert goal.navigation_target == %{goal_id: goal.id}
    assert discussion.matched_field == :title
    assert discussion.navigation_target == %{discussion_id: discussion.id}
  end

  test "builds semantic matches and navigation for milestones, tasks, and people" do
    milestone = ResultBuilder.build_one(candidate(%{source_type: :milestone, exact_title: true}))
    project_id = Ecto.UUID.generate()
    space_id = Ecto.UUID.generate()
    task = ResultBuilder.build_one(candidate(%{source_type: :task, source_project_id: project_id, source_space_id: space_id, body_kind: "description"}))
    person = ResultBuilder.build_one(candidate(%{source_type: :person, body_kind: "title"}))

    assert milestone.matched_field == :title
    assert milestone.navigation_target == %{milestone_id: milestone.id}
    assert task.matched_field == :description
    assert task.navigation_target == %{task_id: task.id, project_id: project_id, space_id: space_id}
    assert person.matched_field == :title
    assert person.navigation_target == %{person_id: person.id}
  end

  test "builds semantic matches and navigation for check-ins and retrospectives" do
    project_id = Ecto.UUID.generate()

    project_check_in = ResultBuilder.build_one(candidate(%{source_type: :project_check_in, exact_title: true}))
    goal_check_in = ResultBuilder.build_one(candidate(%{source_type: :goal_check_in, body_kind: "message"}))

    retrospective =
      ResultBuilder.build_one(
        candidate(%{
          source_type: :project_retrospective,
          source_project_id: project_id,
          body_kind: "content"
        })
      )

    assert project_check_in.matched_field == :title
    assert project_check_in.navigation_target == %{project_check_in_id: project_check_in.id}
    assert goal_check_in.matched_field == :message
    assert goal_check_in.navigation_target == %{goal_check_in_id: goal_check_in.id}

    assert retrospective.navigation_target == %{
             project_id: project_id,
             project_retrospective_id: retrospective.id
           }
  end

  defp candidate(overrides) do
    Map.merge(
      %{
        source_id: Ecto.UUID.generate(),
        source_type: :resource_hub_document,
        resource_hub_id: Ecto.UUID.generate(),
        source_project_id: nil,
        source_space_id: nil,
        source_goal_id: nil,
        title: "Research",
        owner_name: "Product",
        body_kind: "content",
        exact_title: false,
        prefix_title: false,
        title_match: false,
        body: "customer evidence",
        body_snippet: "customer evidence",
        state: nil,
        source_inserted_at: ~N[2026-07-28 12:00:00]
      },
      overrides
    )
  end
end
