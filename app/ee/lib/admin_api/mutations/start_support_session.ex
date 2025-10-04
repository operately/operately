defmodule OperatelyEE.AdminApi.Mutations.StartSupportSession do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.People.AccountToken
  alias Operately.People.Person
  alias Operately.Repo

  inputs do
    field :company_id, :company_id
  end

  outputs do
    field :success, :boolean
    field :url, :string
  end

  def call(conn, inputs) do
    with {:ok, account} <- find_account(conn),
         true <- Account.is_site_admin?(account) || {:error, :forbidden},
         {:ok, company} <- load_company(inputs.company_id),
         {:ok, owner} <- pick_owner(company),
         {:ok, url} <- build_session(account, owner) do
      {:ok, %{success: true, url: url}}
    else
      {:error, :no_owner} -> {:error, :bad_request}
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_company(short_id) do
    case Company.get(:system, short_id: short_id) do
      {:ok, company} -> {:ok, Company.load_owners(company)}
      {:error, _} -> {:error, :not_found}
    end
  end

  defp pick_owner(company) do
    case company.owners do
      [%Person{} = owner | _] -> {:ok, owner}
      _ -> {:error, :no_owner}
    end
  end

  defp build_session(account, owner) do
    Repo.delete_all(AccountToken.account_and_contexts_query(account, ["support_session"]))

    {token, token_struct} = AccountToken.build_support_session_token(account, owner)

    case Repo.insert(token_struct) do
      {:ok, _} ->
        url = OperatelyWeb.Endpoint.url() <> "/support/session/#{token}"
        {:ok, url}

      {:error, _changeset} ->
        {:error, :internal_server_error}
    end
  end
end
