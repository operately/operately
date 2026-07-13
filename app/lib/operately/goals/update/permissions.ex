defmodule Operately.Goals.Update.Permissions do
  def __api_typename__, do: "goal_update_permissions"

  import Ecto.Query, only: [from: 2]

  alias Operately.Access.Binding
  alias Operately.Goals.Update
  alias Operately.Permissions.ReadOnly
  alias Operately.Repo

  defstruct [
    :can_view,
    :can_edit,
    :can_delete,
    :can_acknowledge,
    :can_comment,
  ]

  def calculate(access_level, update, user_id, company_read_only: company_read_only) when is_binary(user_id) do
    permissions = %__MODULE__{
      can_view: can_view(access_level),
      can_edit: can_edit(access_level),
      can_delete: can_delete(access_level),
      can_acknowledge: can_acknowledge(access_level, update, user_id),
      can_comment: can_comment(access_level)
    }

    if company_read_only, do: ReadOnly.view_only(permissions), else: permissions
  end

  def can_view(access_level), do: access_level >= Binding.view_access()
  def can_edit(access_level), do: access_level >= Binding.edit_access()
  def can_delete(access_level), do: access_level >= Binding.edit_access()
  def can_comment(access_level), do: access_level >= Binding.comment_access()

  def can_acknowledge(access_level, update, user_id) when is_binary(user_id) do
    can_edit(access_level) and author_id(update) != user_id
  end

  def check_can_edit(access_level, company_read_only: company_read_only) do
    if can_edit(access_level) do
      if company_read_only, do: {:error, :unauthorized}, else: {:ok, :allowed}
    else
      {:error, :unauthorized}
    end
  end

  def check(access_level, update, user_id, permission, company_read_only: company_read_only) when is_atom(permission) and is_binary(user_id) do
    permissions = calculate(access_level, update, user_id, company_read_only: company_read_only)

    case Map.get(permissions, permission) do
      true -> {:ok, :allowed}
      false -> {:error, :unauthorized}
      nil -> raise "Unknown permission: #{permission}"
    end
  end

  defp author_id(%Update{author_id: author_id}), do: author_id

  defp author_id(update_id) when is_binary(update_id) do
    Repo.one(from(u in Update, where: u.id == ^update_id, select: u.author_id))
  end
end
