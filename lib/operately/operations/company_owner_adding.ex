defmodule Operately.Operations.CompanyOwnerAdding do
  alias Ecto.Multi
  alias Operately.{Repo, Access}
  alias Operately.Access.{Binding}
  alias Operately.People.Person

  def run(author, %Person{} = person), do: run(author, person.id)
  def run(author, id) when is_binary(id), do: run(author, [id])

  def run(author, ids) do
    Multi.new()
    |> Multi.put(:author, author)
    |> Multi.put(:context, Access.get_context!(company_id: author.company_id))
    |> Multi.put(:owner_group, Access.get_group!(company_id: author.company_id, tag: :full_access))
    |> add_owners(ids)
    |> insert_activity(author)
    |> Repo.transaction()
  end

  defp add_owners(multi, ids) do
    Enum.reduce(ids, multi, fn id, multi ->
      Multi.run(multi, "person_#{id}", fn _, ctx ->
        person = Operately.People.get_person!(id)
        {:ok, _} = Access.bind(ctx.context, person_id: id, level: Binding.full_access())
        {:ok, _} = Access.add_to_group(ctx.owner_group, person_id: id)
        {:ok, person}
      end)
    end)
  end

  defp insert_activity(multi, _) do
    # TODO
    multi
  end
end
