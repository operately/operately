defmodule OperatelyWeb.Api.CompanyTransfers.StartExport do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.CompanyTransfers
  alias Operately.Companies.Company

  outputs do
    field :export_run, :company_export_run, null: false
  end

  def call(conn, _inputs) do
    Action.new()
    |> run(:company, fn -> find_company(conn) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:account, fn -> find_account(conn) end)
    |> run(:check_permissions, fn ctx -> authorize(ctx.company, ctx.me) end)
    |> run(:export_run, fn ctx -> create_export(ctx.company, ctx.account) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{export_run: Serializer.serialize(ctx.export_run, level: :full)}}
      {:error, :company, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :export_run, changeset} -> {:error, changeset}
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

  defp create_export(company, account) do
    CompanyTransfers.create_export_run(company, account)
  end
end
