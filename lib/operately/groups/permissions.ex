defmodule Operately.Groups.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_edit,
    :can_edit_permissions,
  ]

  def calculate_permissions(access_level) do
    %__MODULE__{
      can_view: can_view(access_level, boolean: true),
      can_edit: can_edit(access_level, boolean: true),
      can_edit_permissions: can_edit_permissions(access_level, boolean: true),
    }
  end

  def can_view(access_level, boolean: true), do: access_level >= Binding.view_access()
  def can_view(access_level), do: ok_or_error(access_level >= Binding.view_access())

  def can_edit(access_level, boolean: true),do: access_level >= Binding.edit_access()
  def can_edit(access_level),do: ok_or_error(access_level >= Binding.edit_access())

  def can_edit_permissions(access_level, boolean: true), do: access_level >= Binding.full_access()
  def can_edit_permissions(access_level), do: ok_or_error(access_level >= Binding.full_access())

  defp ok_or_error(true), do: {:ok, :allowed}
  defp ok_or_error(false), do: {:error, :forbidden}
end
