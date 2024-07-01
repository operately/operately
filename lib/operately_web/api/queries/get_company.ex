defmodule OperatelyWeb.Api.Queries.GetCompany do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :string
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    me(conn)
    |> Operately.Companies.get_company_by_short_id(inputs[:id])
    |> case do
      nil -> {:error, :not_found}
      company -> Serializer.serialize(company, level: :short)
    end
  end
end
