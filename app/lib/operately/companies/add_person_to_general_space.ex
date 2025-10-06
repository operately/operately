defmodule Operately.Companies.AddPersonToGeneralSpace do
  alias Ecto.Multi
  import Ecto.Query, only: [from: 2]

  alias Operately.{Access, Repo}
  alias Operately.Access.Binding
  alias Operately.Companies
  alias Operately.Groups.Member
  alias Operately.People.Person

  def run(%Person{} = person) do
    case Companies.get_company_space(person.company_id) do
      nil ->
        {:ok, nil}

      space ->
        membership_exists? = already_member?(person.id, space.id)
        group = Access.get_group(person_id: person.id)
        context = Access.get_context(group_id: space.id)
        binding_exists? = binding_exists?(group, context)

        if membership_exists? && binding_exists? do
          {:ok, nil}
        else
          Multi.new()
          |> maybe_insert_membership(space, person, membership_exists?)
          |> maybe_create_binding(group, context, binding_exists?)
          |> Repo.transaction()
        end
    end
  end

  defp already_member?(person_id, group_id) do
    Repo.exists?(from m in Member, where: m.person_id == ^person_id and m.group_id == ^group_id)
  end

  defp maybe_insert_membership(multi, _space, _person, true), do: multi

  defp maybe_insert_membership(multi, space, person, false) do
    Multi.insert(multi, :member, fn _ ->
      Member.changeset(%Member{}, %{
        group_id: space.id,
        person_id: person.id
      })
    end)
  end

  defp maybe_create_binding(multi, _group, _context, true), do: multi
  defp maybe_create_binding(multi, nil, _context, _), do: multi
  defp maybe_create_binding(multi, _group, nil, _), do: multi

  defp maybe_create_binding(multi, group, context, _binding_exists?) do
    Multi.run(multi, :binding, fn _, _ ->
      Access.create_binding(%{
        group_id: group.id,
        context_id: context.id,
        access_level: Binding.edit_access()
      })
    end)
  end

  defp binding_exists?(nil, _context), do: false
  defp binding_exists?(_group, nil), do: false
  defp binding_exists?(group, context), do: not is_nil(Access.get_binding(context_id: context.id, group_id: group.id))
end
