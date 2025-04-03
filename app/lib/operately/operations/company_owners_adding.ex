defmodule Operately.Operations.CompanyOwnersAdding do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.{Repo, Access, Activities}
  alias Operately.Access.Binding

  def run(author, id) when is_binary(id), do: run(author, [id])

  def run(author, ids) when is_list(ids) do
    Multi.new()
    |> Multi.put(:author, author)
    |> Multi.put(:context, Access.get_context!(company_id: author.company_id))
    |> Multi.put(:owner_group, Access.get_group(company_id: author.company_id, tag: :full_access))
    |> add_owners(ids)
    |> Activities.insert_sync(author.id, :company_owners_adding, fn _ ->
      %{
        company_id: author.company_id,
        people: Enum.map(ids, fn id -> %{person_id: id} end)
      }
    end)
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
end
