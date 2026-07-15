defmodule Operately.Operations.IdempotentAcknowledgement do
  @moduledoc """
  Serializes acknowledgement transactions so their state change and side effects run once.
  """

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo

  def run(resource, acknowledge) when is_function(acknowledge, 1) do
    Multi.new()
    |> Multi.run(:locked_resource, fn repo, _changes -> lock_resource(repo, resource) end)
    |> Multi.merge(fn %{locked_resource: locked_resource} ->
      locked_resource = restore_loaded_associations(locked_resource, resource)

      if locked_resource.acknowledged_at do
        already_acknowledged(locked_resource)
      else
        acknowledge.(locked_resource)
        |> Multi.put(:acknowledgement_status, :acknowledged)
      end
    end)
    |> Repo.transaction()
    |> extract_result()
  end

  defp lock_resource(repo, resource) do
    query =
      from(r in resource.__struct__,
        where: r.id == ^resource.id,
        lock: "FOR UPDATE"
      )

    case repo.one(query) do
      nil -> {:error, :not_found}
      locked_resource -> {:ok, locked_resource}
    end
  end

  # The locking query refreshes the resource without its preloads, so carry loaded
  # associations forward for the acknowledgement callback and response serialization.
  defp restore_loaded_associations(locked_resource, resource) do
    resource.__struct__.__schema__(:associations)
    |> Enum.reduce(locked_resource, fn association, resource_with_associations ->
      association_value = Map.fetch!(resource, association)

      if Ecto.assoc_loaded?(association_value) do
        Map.put(resource_with_associations, association, association_value)
      else
        resource_with_associations
      end
    end)
  end

  defp already_acknowledged(locked_resource) do
    Multi.new()
    |> Multi.put(:acknowledged_resource, locked_resource)
    |> Multi.put(:acknowledgement_status, :already_acknowledged)
  end

  defp extract_result({:ok, %{acknowledged_resource: resource, acknowledgement_status: status}}) do
    {:ok, resource, status}
  end

  defp extract_result(error), do: error
end
