defmodule OperatelyWeb.Api.Queries.GetGoals do
  use TurboConnect.Query

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
    |> Goal.scope_company(person.company_id)
    |> Goal.scope_space(inputs[:space_id])
    |> include_requested(include_filters)
    |> Repo.all()
  end

  def include_requested(query, requested) do
    Enum.reduce(requested, query, fn include, q ->
      case include do
        :include_targets -> from p in q, preload: [:targets]
        :include_projects -> from p in q, preload: [:projects]
        :include_last_check_in -> from p in q, preload: [last_check_in: :author]
        _ -> q 
      end
    end)
  end
end
