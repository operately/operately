defmodule Operately.Operations.IdempotentAcknowledgement do
  @moduledoc """
  Serializes acknowledgement transactions so their state change and side effects run once.
  """

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Repo.Locking

  def run(resource, acknowledge) when is_function(acknowledge, 1) do
    Multi.new()
    |> Multi.run(:locked_resource, fn repo, _changes -> Locking.lock_for_update(repo, resource) end)
    |> Multi.merge(fn %{locked_resource: locked_resource} ->
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
