defmodule Operately.Operations.ResourceHubParentFolderEditing do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.ResourceHubs.{FolderCycle, Node, Parent}

  def run(author, resource, new_folder_id) do
    changeset = Node.changeset(resource.node, %{parent_folder_id: new_folder_id})

    try do
      Multi.new()
      |> Multi.update(:node, changeset)
      |> Activities.insert_sync(author.id, :resource_hub_parent_folder_edited, fn _changes ->
        %{
          resource_hub_id: resource.node.resource_hub_id,
          node_id: resource.node.id,
          new_folder_id: new_folder_id,
          resource_id: resource.id,
          resource_type: Atom.to_string(resource.node.type),
        }
        |> Map.merge(Parent.parent_fields(resource.resource_hub))
      end)
      |> Repo.transaction()
      |> handle_transaction_result(changeset)
    rescue
      e in Postgrex.Error ->
        if FolderCycle.postgres_cycle_error?(e) do
          {:error, FolderCycle.add_changeset_error(changeset)}
        else
          reraise e, __STACKTRACE__
        end
    end
  end

  defp handle_transaction_result({:ok, result}, _changeset), do: {:ok, result}

  defp handle_transaction_result({:error, :node, %Postgrex.Error{} = error, _changes}, changeset) do
    if FolderCycle.postgres_cycle_error?(error) do
      {:error, FolderCycle.add_changeset_error(changeset)}
    else
      {:error, error}
    end
  end

  defp handle_transaction_result({:error, _operation, %Ecto.Changeset{} = changeset, _changes}, _changeset) do
    {:error, changeset}
  end

  defp handle_transaction_result(error, _changeset), do: error
end
