defmodule Operately.ResourceHubs.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_view,
    :can_comment_on_document,
    :can_comment_on_file,
    :can_create_document,
    :can_create_folder,
    :can_create_file,
    :can_delete_document,
    :can_delete_file,
    :can_delete_folder,
    :can_edit_document,
    :can_rename_folder,
  ]

  def calculate(access_level) when is_integer(access_level) do
    %__MODULE__{
      can_view: access_level >= Binding.view_access(),
      can_comment_on_document: access_level >= Binding.comment_access(),
      can_comment_on_file: access_level >= Binding.comment_access(),
      can_create_document: access_level >= Binding.edit_access(),
      can_create_folder: access_level >= Binding.edit_access(),
      can_create_file: access_level >= Binding.edit_access(),
      can_delete_document: access_level >= Binding.edit_access(),
      can_delete_file: access_level >= Binding.edit_access(),
      can_delete_folder: access_level >= Binding.edit_access(),
      can_edit_document: access_level >= Binding.edit_access(),
      can_rename_folder: access_level >= Binding.edit_access(),
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
