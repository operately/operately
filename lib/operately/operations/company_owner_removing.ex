defmodule Operately.Operations.CompanyOwnerRemoving do
  alias Ecto.Multi

  alias Operately.{Repo, Access, Activities}

  def run(author, person_id) do
    Multi.new()
    |> Multi.put(:author, author)
    |> Multi.put(:person_id, person_id)
    |> Multi.put(:owner_group, find_owners_group(author)) 
    |> Multi.run(:reduce_access_level_to_view, &reduce_access_level_to_view/2)
    |> Multi.run(:remove_from_owners_group, &remove_from_owners_group/2)
    |> insert_activity(author)
    |> Repo.transaction()
  end

  defp reduce_access_level_to_view(_, ctx) do
    context = Access.get_context!(company_id: ctx.author.company_id)
    Access.bind(context, person_id: ctx.person_id, level: Access.Binding.view_access())
  end

  defp remove_from_owners_group(_, ctx) do
    {:ok, _} = Access.remove_from_group(ctx.owner_group, person_id: ctx.person_id)
  end

  defp insert_activity(multi, admin) do
    Activities.insert_sync(multi, admin.id, :company_admin_removed, fn changes ->
      %{
        company_id: changes.author.company_id,
        person_id: changes.person_id,
      }
    end)
  end

  defp find_owners_group(author) do
    Access.get_group(company_id: author.company_id, tag: :full_access)
  end
end
