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
        state: :archived
      }),
      candidate(%{
        source_id: file_id,
        source_type: :resource_hub_file,
        resource_hub_id: hub_id,
        title: "Research.pdf",
        body_kind: "description",
        body_snippet: "__OPERATELY_SEARCH_START__customer__OPERATELY_SEARCH_STOP__ evidence"
      })
    ]

    assert [
             %Result{
               id: ^document_id,
               type: :resource_hub_document,
               matched_field: :title,
               snippet: nil,
               state: :archived,
               navigation_target: %{resource_hub_id: ^hub_id, document_id: ^document_id}
             },
             %Result{
               id: ^file_id,
               type: :resource_hub_file,
               matched_field: :description,
               snippet: "customer evidence",
               navigation_target: %{resource_hub_id: ^hub_id, file_id: ^file_id}
             }
           ] = ResultBuilder.build(candidates)
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

  defp candidate(overrides) do
    Map.merge(
      %{
        source_id: Ecto.UUID.generate(),
        source_type: :resource_hub_document,
        resource_hub_id: Ecto.UUID.generate(),
        title: "Research",
        owner_name: "Product",
        body_kind: "content",
        exact_title: false,
        prefix_title: false,
        title_match: false,
        body_snippet: "customer evidence",
        state: nil
      },
      overrides
    )
  end
end
