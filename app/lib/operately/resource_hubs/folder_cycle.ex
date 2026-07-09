defmodule Operately.ResourceHubs.FolderCycle do
  @moduledoc false

  @cycle_error_message "This item can't be moved into one of its subfolders"
  @cycle_check_function "check_resource_node_folder_cycle"

  def cycle_error_message, do: @cycle_error_message

  def postgres_cycle_error?(%Postgrex.Error{postgres: %{code: :raise_exception, where: where}})
      when is_binary(where),
      do: String.contains?(where, @cycle_check_function)

  def postgres_cycle_error?(_), do: false

  def add_changeset_error(changeset) do
    Ecto.Changeset.add_error(changeset, :parent_folder_id, @cycle_error_message)
  end
end
