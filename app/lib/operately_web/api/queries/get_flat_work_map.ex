defmodule OperatelyWeb.Api.Queries.GetFlatWorkMap do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.WorkMaps.GetWorkMapQuery

  inputs do
    field? :space_id, :id, null: true
    field? :parent_goal_id, :id, null: true
    field? :champion_id, :id, null: true
    field? :reviewer_id, :id, null: true
    field? :contributor_id, :id, null: true
    field? :only_completed, :boolean, null: true
    field? :include_assignees, :boolean, null: true
  end

  outputs do
    field? :work_map, list_of(:work_map_item), null: true
  end

  def call(conn, inputs) do
    person = me(conn)
    company = company(conn)

    {:ok, flat_work_map} =
      GetWorkMapQuery.execute(
        person,
        %{
          company_id: company.id,
          space_id: inputs[:space_id],
          parent_goal_id: inputs[:parent_goal_id],
          champion_id: inputs[:champion_id],
          reviewer_id: inputs[:reviewer_id],
          contributor_id: inputs[:contributor_id],
          only_completed: inputs[:only_completed] || false,
          include_assignees: inputs[:include_assignees] || false
        },
        :flat
      )

    {:ok, %{work_map: Serializer.serialize(flat_work_map)}}
  end
end
