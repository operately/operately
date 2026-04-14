defmodule OperatelyWeb.Api.CompanyTransfers.GetExportRun do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.CompanyTransfers
  alias Operately.Companies.Company

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :export_run, :company_export_run, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:run, fn -> fetch_run(inputs.id) end)
    |> run(:me, fn -> find_me(conn) end)
    |> run(:company, fn ctx -> fetch_company(ctx.run) end)
    |> run(:check_permissions, fn ctx -> authorize(ctx.company, ctx.me) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{export_run: Serializer.serialize(ctx.run, level: :full)}}
      {:error, :run, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_run(id) do
    case CompanyTransfers.get_export_run(id) do
      nil -> {:error, :not_found}
      run -> {:ok, Repo.preload(run, [:json_blob, :zip_blob])}
    end
  end

  defp fetch_company(run) do
    case Repo.get(Company, run.company_id) do
      nil -> {:error, :not_found}
      company -> {:ok, company}
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
