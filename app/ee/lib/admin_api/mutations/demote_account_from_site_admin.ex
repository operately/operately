defmodule OperatelyEE.AdminApi.Mutations.DemoteAccountFromSiteAdmin do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.AccountSiteAdminUpdating
  alias Operately.People.Account

  inputs do
    field :account_id, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
    field? :error, :string, null: false
  end

  def call(conn, inputs) do
    with {:ok, current_account} <- find_account(conn),
         true <- Account.is_site_admin?(current_account) || {:error, :forbidden},
         {:ok, target_account} <- load_account(inputs.account_id) do
      case AccountSiteAdminUpdating.demote(target_account) do
        {:ok, _account} ->
          {:ok, %{success: true}}

        {:error, :last_site_admin} ->
          {:ok, %{success: false, error: last_site_admin_error()}}

        {:error, :not_found} ->
          {:error, :not_found}

        {:error, _reason} ->
          {:error, :internal_server_error}
      end
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_account(id) do
    case Account.get(:system, id: id) do
      {:ok, account} -> {:ok, account}
      {:error, :not_found} -> {:error, :not_found}
    end
  end

  defp last_site_admin_error do
    "This account cannot be demoted because it is the last site admin. Promote another account to site admin first."
  end
end
