defmodule Operately.Activities.Permissions do
  alias Operately.Access.Binding

  defstruct [
    :can_comment_on_thread,
  ]

  def calculate_permissions(access_level) do
    %__MODULE__{
      can_comment_on_thread: access_level >= Binding.comment_access(),
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
