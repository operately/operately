defmodule Operately.People.InsertPersonIntoOperation do
  alias Ecto.Multi
  alias Operately.Access

  def insert(multi, callback) when is_function(callback, 1) do
    multi
    |> Multi.insert(:person, fn changes -> callback.(changes) end)
    |> insert_person_access_group()
    |> insert_membership_with_company_group()
    |> insert_company_space_member()
  end

  defp insert_person_access_group(multi) do
    multi
    |> Multi.insert(:person_access_group, fn changes ->
      Access.Group.changeset(%{person_id: changes.person.id})
    end)
    |> Multi.insert(:person_access_membership, fn changes ->
      Access.GroupMembership.changeset(%{
        group_id: changes.person_access_group.id,
        person_id: changes.person.id,
      })
    end)
  end

  defp insert_membership_with_company_group(multi) do
    multi
    |> Multi.run(:company_access_group, fn _, %{person: person} ->
      {:ok, Access.get_group!(company_id: person.company_id, tag: :standard)}
    end)
    |> Multi.insert(:company_access_membership, fn changes ->
      Access.GroupMembership.changeset(%{
        group_id: changes.company_access_group.id,
        person_id: changes.person.id,
      })
    end)
  end

  defp insert_company_space_member(multi) do
    multi
    |> Multi.insert(:company_space_member, fn changes ->
      Operately.Groups.Member.changeset(%{
        group_id: changes.company_space.id,
        person_id: changes.person.id,
      })
    end)
  end
end
