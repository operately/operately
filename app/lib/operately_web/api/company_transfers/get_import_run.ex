defmodule OperatelyWeb.Api.CompanyTransfers.GetImportRun do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.CompanyTransfers

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :import_run, :company_import_run, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:run, fn -> fetch_run(inputs.id) end)
    |> run(:account, fn -> find_account(conn) end)
    |> run(:check_permissions, fn ctx -> authorize(ctx.run, ctx.account) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, %{import_run: Serializer.serialize(ctx.run, level: :full)}}
      {:error, :run, _} -> {:error, :not_found}
      {:error, :account, _} -> {:error, :forbidden}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp fetch_run(id) do
    case CompanyTransfers.get_import_run(id) do
      nil -> {:error, :not_found}
      run -> {:ok, run}
    end
  end

  defp authorize(run, account) do
    if run.requested_by_id == account.id do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
