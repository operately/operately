defmodule OperatelyWeb.Api.Queries.GetGoals do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Goals.Goal

  inputs do
    field :space_id, :string

    field :include_targets, :boolean
    field :include_projects, :boolean
    field :include_last_check_in, :boolean
  end

  outputs do
    field :goals, list_of(:goal)
  end

  def call(conn, inputs) do
    goals = load(me(conn), inputs)
    output = %{goals: Serializer.serialize(goals, level: :full)}

    {:ok, output}
  end

  defp load(person, inputs) do
    include_filters = extract_include_filters(inputs)

    (from p in Goal, as: :goal)
    |> Goal.scope_space(inputs[:space_id])
    |> Goal.scope_company(person.company_id)
    |> include_requested(include_filters)
    |> Repo.all()
    |> Goal.prealod_last_check_ins()
  end

  defp include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_targets -> from p in q, preload: [:targets]
        :include_projects -> from p in q, preload: [:projects]
        :include_last_check_in -> q # this is done after the load
        _ -> q 
      end
    end)
  end
end
