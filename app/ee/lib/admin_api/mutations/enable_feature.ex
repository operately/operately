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
         {:ok, company} <- load(inputs.company_id),
         {:ok, _updated} <- enable_feature(company, inputs.feature) do
      {:ok, %{success: true}}
    else
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      _e -> {:error, :internal_server_error}
    end
  end

  defp load(id) do
    Company.get(:system, short_id: id)
  end

  defp enable_feature(company, feature) do
    Operately.Companies.enable_experimental_feature(company, feature)
  end
end
