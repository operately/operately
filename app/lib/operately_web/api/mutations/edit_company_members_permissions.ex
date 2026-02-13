defmodule OperatelyWeb.Api.Mutations.EditCompanyMembersPermissions do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Companies.Company
  alias Operately.Companies.Permissions
  alias Operately.Operations.CompanyMembersPermissionsEditing
  alias Operately.Access.Binding

  inputs do
    field :members, list_of(:edit_company_member_permissions_input), null: false
  end

  outputs do
    field :success, :boolean, null: false
  end

  def call(conn, inputs) do
    me = find_me(conn) |> unwrap()
    company = Company.get(me, id: me.company_id) |> unwrap()

    :ok = authorize(company)

    members = parse_members(inputs.members)
    :ok = validate_access_levels(company, members)

    {:ok, _} = CompanyMembersPermissionsEditing.run(me, members)
    {:ok, %{success: true}}
  catch
    {:error, :forbidden} -> {:error, :forbidden}
    {:error, :not_found} -> {:error, :not_found}
    {:error, _} -> {:error, :internal_server_error}
  end

  defp authorize(company) do
    access_level = company.request_info.access_level

    case Permissions.check(access_level, :can_edit_members_access_levels) do
      {:ok, :allowed} -> :ok
      {:error, _} -> throw {:error, :forbidden}
    end
  end

  defp validate_access_levels(company, members) do
    caller_access_level = company.request_info.access_level

    Enum.each(members, fn member ->
      if member.access_level > caller_access_level do
        throw {:error, :forbidden}
      end
    end)

    :ok
  end

  defp parse_members(members) do
    Enum.map(members, fn member ->
      %{member | access_level: Binding.from_atom(member.access_level)}
    end)
  end

  defp unwrap({:ok, value}), do: value
  defp unwrap({:error, :not_found}), do: throw {:error, :not_found}
  defp unwrap({:error, _}), do: throw {:error, :internal_server_error}
end
