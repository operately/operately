defmodule OperatelyEE.AdminApi.Mutations.DisableFeatures do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.People.Account
  alias Operately.Repo

  inputs do
    field :company_id, :company_id
    field :features, list_of(:string)
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    with {:ok, account} <- find_account(conn),
         true <- Account.is_site_admin?(account) || {:error, :forbidden},
         :ok <- validate_features(inputs.features),
         {:ok, company} <- load(inputs.company_id),
         {:ok, _updated} <- disable_features(company, inputs.features) do
      {:ok, %{success: true}}
    else
      {:error, :bad_request, message} -> {:error, :bad_request, message}
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _e -> {:error, :internal_server_error}
    end
  end

  defp validate_features(features) when is_list(features) and features != [], do: :ok
  defp validate_features(_), do: {:error, :bad_request, "Features list cannot be empty"}

  defp load(id) do
    Company.get(:system, short_id: id)
  end

  defp disable_features(company, features) do
    company = Repo.reload(company)
    remaining = company.enabled_experimental_features -- features

    company
    |> Company.changeset(%{enabled_experimental_features: remaining})
    |> Repo.update()
  end
end
