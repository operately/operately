defmodule Operately.Operations.CompanyAdminAdding do
  alias Ecto.Multi

  @type id :: binary()

  @spec run(Person.t(), Company.t(), list(id)) :: {:ok, map()} | {:error, any()}
  def run(author, company, ids) do
    Multi.new()
    |> add_admins(company, ids)
    |> insert_activity(author)
    |> Operately.Repo.transaction()
  end

  defp add_admins(multi, company, people_ids) do
    context = Operately.Access.get_context(company)

    Enum.reduce(people_ids, multi, fn id, multi ->
      grant_edit_access(multi, context, id)
    end)
  end

  defp insert_activity(multi, admin) do
    Operately.Activities.insert_sync(multi, admin.id, :company_admin_added, fn changes ->
      %{
        company_id: admin.company_id,
        people: serialize_people(changes),
      }
    end)
  end

  defp serialize_people(changes) do
    changes
    |> Enum.filter(fn {key, _} -> is_binary(key) && String.starts_with?(key, "person_") end)
    |> Enum.map(fn {_, person} -> %{
      id: person.id,
      email: person.email,
      full_name: person.full_name,
    } end)
  end

  defp grant_edit_access(multi, context, person_id) do
    Multi.run(multi, "person" <> person_id, fn _, _ ->
      Operately.Access.bind(context, person_id: person_id, level: Operately.Access.Binding.edit_access())
    end)
  end
end
