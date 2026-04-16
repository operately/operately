defmodule OperatelyWeb.Api.CompanyTransfers.ListImportRuns do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.CompanyTransfers

  inputs do
  end

  outputs do
    field :import_runs, list_of(:company_import_run), null: false
  end

  def call(conn, _inputs) do
    Action.new()
    |> run(:account, fn -> find_account(conn) end)
    |> run(:runs, fn ctx -> fetch_runs(ctx.account.id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{import_runs: Serializer.serialize(ctx.runs, level: :essential)}}
      {:error, :account, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_runs(account_id) do
    runs =
      account_id
      |> CompanyTransfers.list_account_import_runs()
      |> Repo.preload(:company)

    {:ok, runs}
  end
end
