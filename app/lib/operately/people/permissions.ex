defmodule Operately.People.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_edit_profile
  ]

  def calculate(access_level) do
    %__MODULE__{
      can_edit_profile: access_level >= Binding.edit_access()
    }
  end

  def check(access_level, permission) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
