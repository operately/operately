defmodule OperatelyWeb.Api.Queries.GetActivity do
  use TurboConnect.Query

  inputs do
    field :id, :string
  end

  outputs do
    field :activity, :activity
  end

  def call(_conn, _inputs) do
    raise "Not implemented"
  end
end
