defmodule Operately.Goals.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_edit,
    :can_comment,
    :has_full_access
  ]

  def calculate(access_level) do
    %__MODULE__{
      can_view: access_level >= Binding.view_access(),
      can_comment: access_level >= Binding.comment_access(),
      can_edit: access_level >= Binding.edit_access(),
      has_full_access: access_level >= Binding.full_access(),
    }
  end

  def check(access_level, permission) when is_atom(permission) and is_integer(access_level) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
