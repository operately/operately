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
    if inputs[:id] == nil do
      {:error, :bad_request}
    else
      Operately.Companies.get_company_by_short_id(me(conn), id_without_comments(inputs[:id]))
      |> case do
        nil -> {:error, :not_found}
        company -> {:ok, Serializer.serialize(company, level: :essential)}
      end
    end
  end

end
