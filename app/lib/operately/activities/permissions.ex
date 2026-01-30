defmodule Operately.Activities.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_edit_comment_thread,
    :can_comment_on_thread,
    :can_view,
  ]

  def calculate_permissions(access_level) do
    %__MODULE__{
      can_edit_comment_thread: access_level >= Binding.full_access(),
      can_comment_on_thread: access_level >= Binding.comment_access(),
      can_view: access_level >= Binding.view_access(),
    }
  end

  def check(access_level, permission) do
    permissions = calculate_permissions(access_level)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end
end
