defmodule OperatelyWeb.Api.CompanyTransfers.ListExportRuns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.CompanyTransfers
  alias Operately.Companies.Company

  outputs do
    field :export_runs, list_of(:company_export_run), null: false
  end

  def call(conn, _inputs) do
    Action.new()
    |> run(:company, fn -> find_company(conn) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:check_permissions, fn ctx -> authorize(ctx.company, ctx.me) end)
    |> run(:runs, fn ctx -> fetch_runs(ctx.company.id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{export_runs: Serializer.serialize(ctx.runs, level: :essential)}}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_runs(company_id) do
    {:ok, CompanyTransfers.list_company_export_runs(company_id)}
  end

  defp authorize(company, me) do
    if Company.is_owner?(company, me) do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
