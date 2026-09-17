defmodule OperatelyEE.AdminApi.Mutations.EnableFeature do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.People.Account

  inputs do
    field :company_id, :company_id
    field :feature, :string
  end

  outputs do
    field :success, :boolean
  end

  def call(conn, inputs) do
    with {:ok, account} <- find_account(conn),
         true <- Account.is_site_admin?(account) || {:error, :forbidden},
         {:ok, feature} <- validate_feature(inputs.feature),
         {:ok, company} <- load(inputs.company_id),
         {:ok, _updated} <- enable_feature(company, feature) do
      {:ok, %{success: true}}
    else
      {:error, :bad_request, message} -> {:error, :bad_request, message}
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _e -> {:error, :internal_server_error}
    end
  end

  defp load(id) do
    Company.get(:system, short_id: id)
  end

  defp validate_feature(feature) when is_binary(feature) do
    feature = String.trim(feature)

    if feature == "" do
      {:error, :bad_request, "Feature name cannot be empty"}
    else
      {:ok, feature}
    end
  end

  defp validate_feature(_), do: {:error, :bad_request, "Feature name cannot be empty"}

  defp enable_feature(company, feature) do
    Operately.Companies.enable_experimental_feature(company, feature)
  end
end
