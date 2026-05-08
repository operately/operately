defmodule OperatelyEE.AdminApi.Mutations.DeleteAccount do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Operations.AccountDeleting
  alias Operately.People.Account

  inputs do
    field :account_id, :string, null: false
  end

  outputs do
    field :success, :boolean, null: false
    field? :error, :string, null: false
    field? :blocking_company_names, list_of(:string), null: false
  end

  def call(conn, inputs) do
    with {:ok, current_account} <- find_account(conn),
         true <- Account.is_site_admin?(current_account) || {:error, :forbidden},
         {:ok, target_account} <- load_account(inputs.account_id) do
      case AccountDeleting.run(target_account) do
        {:ok, _account} ->
          {:ok, %{success: true}}

        {:error, {:last_owner, company_names}} ->
          {:ok, %{
            success: false,
            error: last_owner_error(company_names),
            blocking_company_names: company_names
          }}

        {:error, :last_site_admin} ->
          {:ok, %{success: false, error: "This account cannot be deleted because it is the last site admin."}}

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

  defp last_owner_error([company_name]) do
    "This account cannot be deleted because it is the only active owner of #{company_name}. Transfer ownership or delete the company first."
  end

  defp last_owner_error(company_names) do
    companies = Enum.join(company_names, ", ")
    "This account cannot be deleted because it is the only active owner of these companies: #{companies}. Transfer ownership or delete the companies first."
  end
end
