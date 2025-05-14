defmodule OperatelyWeb.Api.Queries.GetWorkMap do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.WorkMaps.GetWorkMapQuery

  inputs do
    field :space_id, :id
    field :parent_goal_id, :id
    field :owner_id, :id
    field :include_assignees, :boolean
  end

  outputs do
    field :work_map, list_of(:work_map_item)
  end

  def call(conn, inputs) do
    person = me(conn)
    company = company(conn)

    {:ok, work_map} =
      GetWorkMapQuery.execute(person, %{
        company_id: company.id,
        space_id: inputs[:space_id],
        parent_goal_id: inputs[:parent_goal_id],
        owner_id: inputs[:owner_id],
        include_assignees: inputs[:include_assignees] || false
      })

    {:ok, %{work_map: Serializer.serialize(work_map, level: :full)}}
  end
end
