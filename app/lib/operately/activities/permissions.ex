defmodule Operately.Activities.Permissions do
  def __api_typename__, do: "activity_permissions"

  alias Operately.Access.Binding
  alias Operately.Permissions.ReadOnly

  defstruct [
    :can_edit_comment_thread,
    :can_comment_on_thread,
    :can_view,
    :can_acknowledge,
  ]

  def calculate_permissions(access_level, company_read_only: company_read_only) do
    permissions = %__MODULE__{
      can_edit_comment_thread: access_level >= Binding.full_access(),
      can_comment_on_thread: access_level >= Binding.comment_access(),
      can_view: access_level >= Binding.view_access(),
      can_acknowledge: false,
    }

    if company_read_only, do: ReadOnly.view_only(permissions), else: permissions
  end

  def calculate_permissions(activity, access_level, company_read_only: company_read_only) do
    permissions = calculate_permissions(access_level, company_read_only: company_read_only)

    can_acknowledge =
      activity.action == "goal_closing" and
        access_level >= Binding.edit_access() and
        not company_read_only and
        can_acknowledge_as_non_author?(activity)

    %{permissions | can_acknowledge: can_acknowledge}
  end

  def check(access_level, permission, company_read_only: company_read_only) do
    permissions = calculate_permissions(access_level, company_read_only: company_read_only)

    if Map.get(permissions, permission) == true do
      {:ok, :allowed}
    else
      {:error, :forbidden}
    end
  end

  defp can_acknowledge_as_non_author?(activity) do
    requester = activity.request_info && activity.request_info.requester

    case requester do
      %{id: id} when is_binary(id) -> id != activity.author_id
      _ -> false
    end
  end
end
