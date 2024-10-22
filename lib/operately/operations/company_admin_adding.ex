defmodule Operately.Operations.CompanyAdminAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Access, Activities}

  @type id :: binary()

  def run(author, id) when is_binary(id), do: run(author, [id])

  def run(author, ids) when is_list(ids) do
    Multi.new()
    |> Multi.put(:author, author)
    |> Multi.put(:context, Access.get_context!(company_id: author.company_id))
    |> Multi.put(:owners_group, Access.get_group!(company_id: author.company_id, tag: :full_access))
    |> add_admins(ids)
    |> insert_activity(author)
    |> Repo.transaction()
  end

  defp add_admins(multi, ids) do
    Enum.reduce(ids, multi, fn id, multi ->
      Multi.run(multi, "person_#{id}", fn _, ctx ->
        person = Operately.People.get_person!(id)
        {:ok, _} = Operately.Access.bind(ctx.context, person_id: id, level: Operately.Access.Binding.full_access())
        {:ok, _} = Operately.Access.add_to_group(ctx.owners_group, person_id: id)
        {:ok, person}
      end)
    end)
  end

  defp insert_activity(multi, admin) do
    Activities.insert_sync(multi, admin.id, :company_admin_added, fn changes ->
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
end
