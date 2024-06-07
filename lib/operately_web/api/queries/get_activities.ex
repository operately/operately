defmodule OperatelyWeb.Api.Queries.GetActivities do
  use TurboConnect.Query

  inputs do
    field :scope_id, :integer
    field :scope_type, :string
    field :pagination_token, :string
  end

  outputs do
    field :activities, list_of(:activity)
    field :pagination_token, :string
  end

  def call(_input) do
    raise "Not implemented"
  end
end
