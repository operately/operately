defmodule Operately.People.ManagerCycle do
  @cycle_error_message "This would create a circular reporting relationship"

  def cycle_error_message, do: @cycle_error_message

  def postgres_cycle_error?(%Postgrex.Error{postgres: %{message: message}}) when is_binary(message),
    do: String.contains?(message, "Cycle detected")

  def postgres_cycle_error?(_), do: false

  def add_changeset_error(changeset) do
    Ecto.Changeset.add_error(changeset, :manager_id, @cycle_error_message)
  end
end
