defmodule OperatelyWeb.Api.Queries.SearchPotentialSpaceMembers do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  inputs do
    field :group_id, :string
    field :query, :string
    field :exclude_ids, list_of(:string)
    field :limit, :integer
  end

  outputs do
    field :people, list_of(:person)
  end

  def call(_conn, inputs) do
    {:ok, space_id} = decode_id(inputs.group_id)

    query = inputs[:query] || ""
    excluded_ids = inputs[:exclude_ids] || []
    limit = inputs[:limit] || 10

    people = Operately.Groups.list_potential_members(space_id, query, excluded_ids, limit)

    {:ok, %{people: Serializer.serialize(people)}}
  end
end
