defmodule Operately.Data.Change015CreateCompaniesAccessGroup do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Companies
  alias Operately.Access

  def run do
    Repo.transaction(fn ->
      companies = Companies.list_companies()

      Enum.each(companies, fn company ->
        case create_groups(company.id) do
          {:error, _} -> raise "Failed to create access groups"
          _ -> :ok
        end
      end)
    end)
  end

  defp create_groups(company_id) do
    create_group(company_id, :full_access)
    create_group(company_id, :standard)
  end

  defp create_group(company_id, tag) do
    case Access.get_group(company_id: company_id, tag: tag) do
      nil ->
        {:ok, group} = Access.create_group(%{
          company_id: company_id,
          tag: tag,
        })
        create_bindings(company_id, group, tag)
        create_memberships(company_id, group)

      group ->
        create_bindings(company_id, group, tag)
        create_memberships(company_id, group)
        :ok
    end
  end

  defp create_bindings(company_id, group, tag) do
    context = Access.get_context!(company_id: company_id)
    access_level = get_access_level(tag)

    case Access.get_binding(group_id: group.id, context_id: context.id, access_level: access_level) do
      nil -> Access.create_binding(%{
        group_id: group.id,
        context_id: context.id,
        access_level: access_level,
      })
      _ -> :ok
    end
  end

  defp create_memberships(company_id, group) do
    people = from(p in Operately.People.Person, where: p.company_id == ^company_id) |> Repo.all()

    Enum.each(people, fn person ->
      if person.company_role == :admin and group.tag == :full_access do
        create_membership(person, group)
      end

      if person.company_role == :member and group.tag == :standard do
        create_membership(person, group)
      end
    end)
  end

  defp create_membership(person, group) do
    case Access.get_group_membership(person_id: person.id, group_id: group.id) do
      nil ->
        Access.create_group_membership(%{
          person_id: person.id,
          group_id: group.id,
        })
      _ -> :ok
    end
  end

  defp get_access_level(tag) do
    case tag do
      :standard -> 10
      :full_access -> 100
    end
  end
end
