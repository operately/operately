defmodule OperatelyWeb.Api.Queries.GetCompany do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Companies.Company
  alias Operately.Access.Binding

  require Logger

  inputs do
    field? :id, :company_id, null: false

    field? :include_permissions, :boolean, null: false
    field? :include_people, :boolean, null: false
    field? :include_admins, :boolean, null: false
    field? :include_owners, :boolean, null: false
    field? :include_general_space, :boolean, null: false
    field? :include_members_access_levels, :boolean, null: false
  end

  outputs do
    field :company, :company, null: false
  end

  def call(conn, inputs) do
    Company.get(me(conn),
      short_id: inputs.id,
      opts: [
        required_access_level: Binding.minimal_access()
      ]
    )
    |> apply_hooks(inputs)
    |> case do
      {:ok, company} -> {:ok, serialize(company)}
      {:error, :not_found} -> {:error, :not_found}
      e -> internal_server_error(e)
    end
  end

  defp apply_hooks({:error, _} = error, _inputs), do: error

  defp apply_hooks({:ok, company}, inputs) do
    access_level = company.request_info.access_level

    cond do
      access_level >= Binding.view_access() ->
        {:ok, run_after_load_hooks(company, full_hooks(inputs))}

      access_level >= Binding.minimal_access() ->
        {:ok, run_after_load_hooks(company, minimal_hooks(inputs))}

      true ->
        {:error, :not_found}
    end
  end

  defp run_after_load_hooks(company, hooks) do
    Enum.reduce(hooks, company, fn hook, acc -> hook.(acc) end)
  end

  defp full_hooks(inputs) do
    Inputs.parse_includes(inputs,
      include_people: &Company.load_people/1,
      include_admins: &Company.load_admins/1,
      include_owners: &Company.load_owners/1,
      include_permissions: &Company.load_permissions/1,
      include_general_space: &Company.load_general_space/1,
      include_members_access_levels: &Company.preload_members_access_level/1
    )
  end

  defp minimal_hooks(inputs) do
    Inputs.parse_includes(inputs,
      include_permissions: &Company.load_permissions/1
    )
  end

  defp internal_server_error(e) do
    Logger.error("Failed to get company: #{inspect(e)}")
    {:error, :internal_server_error}
  end

  defp serialize(company) do
    %{company: Serializer.serialize(company, level: :full)}
  end
end
