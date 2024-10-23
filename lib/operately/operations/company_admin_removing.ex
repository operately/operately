defmodule Operately.Operations.CompanyAdminRemoving do
  alias Ecto.Multi
  alias Operately.{Repo, Access, Activities}

  def run(admin, person) do
    Multi.new()
    |> Multi.put(:admin, admin)
    |> Multi.put(:person, person)
    |> Multi.run(:reduce_access_level_to_view, &reduce_access_level_to_view/2)
    |> insert_activity(admin)
    |> Repo.transaction()
    |> Repo.extract_result(:person)
  end

  defp reduce_access_level_to_view(_, ctx) do
    context = Access.get_context!(company_id: ctx.admin.company_id)
    Access.bind(context, person_id: ctx.person.id, level: Access.Binding.view_access())
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
