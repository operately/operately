defmodule OperatelyWeb.Api.Queries.GetCompany do
  use TurboConnect.Query

  inputs do
    field :id, :string
    field :include_admins, :boolean
    field :include_people, :boolean
  end

  outputs do
    field :company, :company
  end

  def call(_conn, _inputs) do
    raise "Not implemented"
  end
end
