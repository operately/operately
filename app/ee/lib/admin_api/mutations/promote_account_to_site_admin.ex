defmodule OperatelyEE.AdminApi.Mutations.PromoteAccountToSiteAdmin do
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
         {:ok, target_account} <- load_account(inputs.account_id),
         {:ok, _account} <- AccountSiteAdminUpdating.promote(target_account) do
      {:ok, %{success: true}}
    else
      {:error, :forbidden} -> {:error, :forbidden}
      {:error, :not_found} -> {:error, :not_found}
      {:error, _reason} -> {:error, :internal_server_error}
    end
  end

  defp load_account(id) do
    case Account.get(:system, id: id) do
      {:ok, account} -> {:ok, account}
      {:error, :not_found} -> {:error, :not_found}
    end
  end
end
