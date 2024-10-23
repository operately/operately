defmodule OperatelyWeb.Api.Queries.GetCompany do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Companies.Company

  require Logger

  inputs do
    field :id, :company_id

    field :include_permissions, :boolean
    field :include_people, :boolean
    field :include_admins, :boolean
    field :include_owners, :boolean
  end

  outputs do
    field :company, :company
  end

  def call(conn, inputs) do
    Company.get(me(conn), short_id: inputs.id, opts: [
      after_load: after_load_hooks(inputs)
    ])
    |> case do
      {:ok, company} -> {:ok, serialize(company)}
      {:error, :not_found} -> {:error, :not_found}
      {:error, :forbidden} -> {:error, :forbidden}
      e -> internal_server_error(e)
    end
  end

  def after_load_hooks(inputs) do
    Inputs.parse_includes(inputs, [
      include_people: &Company.load_people/1,
      include_admins: &Company.load_admins/1,
      include_owners: &Company.load_owners/1,
      include_permissions: &Company.load_permissions/1
    ])
  end

  defp internal_server_error(e) do
    Logger.error("Failed to get company: #{inspect(e)}")
    {:error, :internal_server_error}
  end

  defp serialize(company) do
    %{company: Serializer.serialize(company, level: :full)}
  end
end
