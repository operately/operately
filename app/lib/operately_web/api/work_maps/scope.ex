defmodule OperatelyWeb.Api.WorkMaps.Scope do
  alias Operately.Access.Binding
  alias Operately.Companies.Company
  alias Operately.Groups.Group
  import OperatelyWeb.Api.Helpers, only: [company_read_only: 1, me: 1]

  def resolve(conn, space_id) do
    person = me(conn)

    with {:ok, owner} <- get_owner(person, space_id) do
      can_edit = not company_read_only(conn) and owner.request_info.access_level >= Binding.edit_access()
      {:ok, %{person: person, space_id: space_id, can_edit: can_edit}}
    end
  end

  defp get_owner(person, nil), do: Company.get(person, id: person.company_id, opts: [required_access_level: Binding.minimal_access()])
  defp get_owner(person, space_id), do: Group.get(person, id: space_id, company_id: person.company_id)
end
