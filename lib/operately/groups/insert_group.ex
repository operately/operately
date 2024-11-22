defmodule Operately.Groups.InsertGroup do
  alias Ecto.Multi
  alias Operately.{Access, Groups}
  alias Operately.Access.Binding

  def insert(multi, attrs) do
    multi
    |> insert_group(attrs)
    |> insert_context()
    |> insert_access_groups()
    |> insert_bindings(attrs)
    |> insert_default_messages_board()
    |> insert_default_resource_hub()
  end

  defp insert_group(multi, attrs) do
    multi
    |> Multi.insert(:group, fn changes ->
      Groups.Group.changeset(Map.merge(attrs, %{
        company_id: attrs[:company_id] || changes[:company].id
      }))
    end)
  end

  defp insert_context(multi) do
    multi
    |> Multi.insert(:context, fn changes ->
      Access.Context.changeset(%{
        group_id: changes.group.id,
      })
    end)
  end

  defp insert_access_groups(multi) do
    multi
    |> Multi.insert(:space_members_access_group, fn %{group: group} ->
      Access.Group.changeset(%{group_id: group.id, tag: :standard})
    end)
    |> Multi.insert(:space_managers_access_group, fn %{group: group} ->
      Access.Group.changeset(%{group_id: group.id, tag: :full_access})
    end)
  end

  defp insert_bindings(multi, attrs) do
    multi
    |> Multi.run(:company_admins_group, fn _, changes ->
      {:ok, Access.get_group!(company_id: changes.group.company_id, tag: :full_access)}
    end)
    |> Multi.insert(:space_full_access_binding, fn changes ->
      Binding.changeset(%{group_id: changes.company_admins_group.id, context_id: changes.context.id, access_level: Binding.full_access()})
    end)
    |> Multi.run(:company_members_group, fn _, changes ->
      {:ok, Access.get_group!(company_id: changes.group.company_id, tag: :standard)}
    end)
    |> Multi.insert(:space_members_binding, fn changes ->
      access_level = Map.get(attrs, :company_permissions, Binding.no_access())
      Binding.changeset(%{group_id: changes.company_members_group.id, context_id: changes.context.id, access_level: access_level})
    end)
    |> Multi.run(:anonymous_binding, fn _, changes ->
      if attrs[:public_permissions] == Binding.view_access() do
        group = Access.get_group!(company_id: changes.group.company_id, tag: :anonymous)
        Access.create_binding(%{group_id: group.id, context_id: changes.context.id, access_level: Binding.view_access()})
      else
        {:ok, nil}
      end
    end)
  end

  defp insert_default_messages_board(multi) do
    multi
    |> Multi.insert(:messages_board, fn changes ->
      Operately.Messages.MessagesBoard.changeset(%{
        space_id: changes.group.id,
        name: "Messages Board",
      })
    end)
  end

  defp insert_default_resource_hub(multi) do
    multi
    |> Multi.insert(:resource_hub, fn changes ->
      Operately.ResourceHubs.ResourceHub.changeset(%{
        space_id: changes.group.id,
        name: "Resource Hub",
      })
    end)
    |> Multi.insert(:hub_context, fn changes ->
      Access.Context.changeset(%{
        resource_hub_id: changes.resource_hub.id,
      })
    end)
    |> Multi.insert(:company_admins_and_hub_binding, fn changes ->
      Binding.changeset(%{group_id: changes.company_admins_group.id, context_id: changes.hub_context.id, access_level: Binding.full_access()})
    end)
    |> Multi.insert(:company_members_and_hub_binding, fn changes ->
      Binding.changeset(%{group_id: changes.company_members_group.id, context_id: changes.hub_context.id, access_level: Binding.comment_access()})
    end)
    |> Multi.insert(:space_managers_and_hub_binding, fn changes ->
      Binding.changeset(%{group_id: changes.space_managers_access_group.id, context_id: changes.hub_context.id, access_level: Binding.full_access()})
    end)
    |> Multi.insert(:space_members_and_hub_binding, fn changes ->
      Binding.changeset(%{group_id: changes.space_members_access_group.id, context_id: changes.hub_context.id, access_level: Binding.edit_access()})
    end)
  end
end
