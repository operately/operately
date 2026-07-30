defmodule OperatelyWeb.Api.Companies.GlobalSearch do
  @moduledoc """
  Performs grouped navigation and full-text search across a person's company.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Search
  alias Operately.Search.QuickSearch
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :query, :string, null: false
  end

  outputs do
    field :spaces, list_of(:space), null: false
    field :projects, list_of(:project), null: false
    field :goals, list_of(:goal), null: false
    field :milestones, list_of(:milestone), null: false
    field :tasks, list_of(:task), null: false
    field :people, list_of(:person), null: false
    field :full_text_results, list_of(:search_result), null: false
  end

  @grouped_result_types %{
    spaces: :space,
    projects: :project,
    goals: :goal,
    milestones: :milestone,
    tasks: :task,
    people: :person
  }

  def call(conn, inputs) do
    person = me(conn)

    [quick_results, full_text_results] =
      [
        Task.async(fn -> QuickSearch.search_legacy_groups(person, inputs.query) end),
        Task.async(fn -> Search.search_company(person, inputs.query) end)
      ]
      |> Task.await_many()

    {:ok, serialize(quick_results, full_text_results)}
  end

  defp serialize(quick_results, full_text_results) do
    grouped_results = Map.take(quick_results, Map.keys(@grouped_result_types))

    %{
      spaces: Serializer.serialize(quick_results.spaces, level: :essential),
      projects: Serializer.serialize(quick_results.projects, level: :full),
      goals: Serializer.serialize(quick_results.goals, level: :essential),
      milestones: Serializer.serialize(quick_results.milestones, level: :essential),
      tasks: Serializer.serialize(quick_results.tasks, level: :full),
      people: Serializer.serialize(quick_results.people, level: :essential),
      full_text_results:
        full_text_results
        |> deduplicate_full_text_results(grouped_results)
        |> Serializer.serialize(level: :essential)
    }
  end

  defp deduplicate_full_text_results(full_text_results, grouped_results) do
    grouped_source_keys =
      Enum.reduce(@grouped_result_types, MapSet.new(), fn {group, source_type}, source_keys ->
        grouped_results
        |> Map.fetch!(group)
        |> Enum.reduce(source_keys, fn result, keys -> MapSet.put(keys, {source_type, result.id}) end)
      end)

    Enum.reject(full_text_results, &MapSet.member?(grouped_source_keys, {&1.type, &1.id}))
  end
end
