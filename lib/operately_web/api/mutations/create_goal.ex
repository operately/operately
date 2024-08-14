defmodule OperatelyWeb.Api.Mutations.CreateGoal do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  import Operately.Access.Filters, only: [filter_by_edit_access: 2, forbidden_or_not_found: 2]

  inputs do
    field :space_id, :string
    field :name, :string
    field :champion_id, :string
    field :reviewer_id, :string
    field :timeframe, :timeframe
    field :targets, list_of(:create_target_input)
    field :description, :string
    field :parent_goal_id, :string
    field :anonymous_access_level, :integer
    field :company_access_level, :integer
    field :space_access_level, :integer
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, inputs) do
    person = me(conn)
    company = company(conn)
    {:ok, space_id} = decode_id(inputs.space_id)
    {:ok, champion_id} = decode_id(inputs[:champion_id], :allow_nil)
    {:ok, reviewer_id} = decode_id(inputs[:reviewer_id], :allow_nil)
    {:ok, parent_goal_id} = decode_id(inputs[:parent_goal_id], :allow_nil)

    attrs = Map.merge(inputs, %{
      space_id: space_id,
      champion_id: champion_id,
      reviewer_id: reviewer_id,
      parent_goal_id: parent_goal_id,
    })

    if has_permissions?(person, company, space_id) do
      {:ok, goal} = Operately.Operations.GoalCreation.run(me(conn), attrs)
      {:ok, %{goal: Serializer.serialize(goal, level: :essential)}}
    else
      query(company, space_id)
      |> forbidden_or_not_found(person.id)
    end
  end

  defp has_permissions?(person, company, space_id) do
    query(company, space_id)
    |> filter_by_edit_access(person.id)
    |> Repo.exists?()
  end

  defp query(company, space_id) when company.company_space_id != space_id do
    from(s in Operately.Groups.Group, where: s.id == ^space_id)
  end

  defp query(company, space_id) when company.company_space_id == space_id do
    from(c in Operately.Companies.Company, where: c.id == ^company.id)
  end
end
