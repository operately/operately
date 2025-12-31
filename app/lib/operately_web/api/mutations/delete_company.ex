defmodule OperatelyWeb.Api.Mutations.DeleteCompany do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Operations.CompanyDeleting

  inputs do

  end

  outputs do
    field :success, :boolean
  end

  def call(conn, _inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn -> find_company(conn) end)
    |> run(:check_permissions, fn ctx -> authorize(ctx.company, ctx.me) end)
    |> run(:operation, fn ctx -> CompanyDeleting.run(ctx.company) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{success: true}}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp authorize(company, me) do
    if Company.is_owner?(company, me) do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
