defmodule Operately.Repo.Locking do
  @moduledoc """
  Row locking helpers for transactional operations.

  `FOR UPDATE` reloads a bare row without preloads. Callers that already have
  associations loaded on the input struct can restore them onto the locked row
  so later Multi steps keep working.
  """

  import Ecto.Query, only: [from: 2]

  @doc """
  Locks `resource` by primary key inside `repo`.

  Returns `{:ok, locked}` with loaded associations copied from `resource`, or
  `{:error, :not_found}`.
  """
  def lock_for_update(repo, %{__struct__: _, id: id} = resource) when not is_nil(id) do
    query =
      from(r in resource.__struct__,
        where: r.id == ^id,
        lock: "FOR UPDATE"
      )

    case repo.one(query) do
      nil -> {:error, :not_found}
      locked -> {:ok, restore_loaded_associations(locked, resource)}
    end
  end

  @doc """
  Copies associations that are already loaded on `source` onto `locked`.
  """
  def restore_loaded_associations(locked, source) do
    source.__struct__.__schema__(:associations)
    |> Enum.reduce(locked, fn association, acc ->
      association_value = Map.fetch!(source, association)

      if Ecto.assoc_loaded?(association_value) do
        Map.put(acc, association, association_value)
      else
        acc
      end
    end)
  end
end
