defmodule Operately.Goals.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_edit,
    :can_edit_check_in,
    :can_check_in,
    :can_acknowledge_check_in,
    :can_close,
    :can_archive,
    :can_reopen,
    :can_comment_on_update,
  ]

  def calculate(access_level) do
    %__MODULE__{
      can_view: can_view(access_level),
      can_acknowledge_check_in: can_acknowledge_check_in(access_level),
      can_check_in: can_check_in(access_level),
      can_edit_check_in: can_edit_check_in(access_level),
      can_edit: can_edit(access_level),
      can_reopen: can_edit(access_level),
      can_archive: can_archive(access_level),
      can_close: can_edit(access_level),
      can_comment_on_update: can_comment_on_update(access_level)
    }
  end

  def can_archive(access_level), do: access_level >= Binding.edit_access()
  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_acknowledge_check_in(access_level), do: access_level >= Binding.full_access()
  def can_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit_check_in(access_level), do: access_level >= Binding.full_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_reopen(access_level), do: access_level >= Binding.edit_access()
  def can_comment_on_update(access_level), do: access_level >= Binding.comment_access()

  def check(access_level, permission) when is_atom(permission) and is_integer(access_level) do
    permissions = calculate(access_level)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :forbidden}
      nil -> raise "Unknown permission: #{permission}"
    end
  end
end
