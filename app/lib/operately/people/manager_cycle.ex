defmodule Operately.People.ManagerCycle do
  @cycle_error_message "This would create a circular reporting relationship"
  @cycle_check_function "check_manager_cycle"

  def cycle_error_message, do: @cycle_error_message

  def postgres_cycle_error?(%Postgrex.Error{postgres: %{code: :raise_exception, where: where}})
      when is_binary(where),
      do: String.contains?(where, @cycle_check_function)

  def postgres_cycle_error?(_), do: false

  def add_changeset_error(changeset) do
    Ecto.Changeset.add_error(changeset, :manager_id, @cycle_error_message)
  end
end
