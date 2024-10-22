defmodule Operately.Operations.CompanyAdminRemoving do
  alias Ecto.Multi
  alias Operately.{Repo, Access, Activities, Companies}

  def run(admin, person) do
    Multi.new()
    |> Multi.put(:admin, admin)
    |> Multi.put(:person, person)
    |> Multi.run(:reduce_access_level_to_view, &reduce_access_level_to_view/2)
    |> Multi.run(:add_to_members, &add_to_members/2)
    |> Multi.run(:remove_from_owners, &remove_from_owners/2)
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp reduce_access_level_to_view(_, ctx) do
    context = Access.get_context!(company_id: ctx.admin.company_id)
    Access.bind(context, person_id: ctx.person.id, level: Access.Binding.view_access())
  end

  defp remove_from_owners(_, ctx) do
    group = Companies.get_owner_group(ctx.admin.company_id)
    Access.remove_from_group(group.id, person_id: ctx.person.id)
  end

  defp add_to_members(_, ctx) do
    group = Companies.get_members_group(ctx.admin.company_id)
    Access.add_to_group(group.id, person_id: ctx.person.id)
  end

  defp insert_activity(multi, admin) do
    Activities.insert_sync(multi, admin.id, :company_admin_removed, fn changes ->
      %{
        company_id: changes.person.company_id,
        person_id: changes.person.id,
      }
    end)
  end
end
