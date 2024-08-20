defmodule Operately.Groups.InsertGroup do
  alias Ecto.Multi
  alias Operately.{Access, Groups}
  alias Operately.Access.Binding

  def insert(multi, attrs) do
    multi
    |> insert_group(attrs)
    |> insert_group_context()
    |> insert_members_access_group()
    |> insert_managers_access_group()
    |> insert_bindings(attrs)
  end

  defp insert_group(multi, attrs) do
    multi
    |> Multi.insert(:group, fn changes ->
      Groups.Group.changeset(Map.merge(attrs, %{
        company_id: attrs[:company_id] || changes[:company].id
      }))
    end)
  end

  defp insert_group_context(multi) do
    multi
    |> Multi.insert(:context, fn changes ->
      Access.Context.changeset(%{
        group_id: changes.group.id,
      })
    end)
  end

  defp insert_members_access_group(multi) do
    multi
    |> Multi.insert(:space_members_access_group, fn %{group: group} ->
      Access.Group.changeset(%{group_id: group.id, tag: :standard})
    end)
  end

  defp insert_managers_access_group(multi) do
    multi
    |> Multi.insert(:space_managers_access_group, fn %{group: group} ->
      Access.Group.changeset(%{group_id: group.id, tag: :full_access})
    end)
  end

  defp insert_bindings(multi, attrs) do
    multi
    |> Multi.insert(:space_full_access_binding, fn changes ->
      group = Access.get_group!(company_id: changes.group.company_id, tag: :full_access)

      Binding.changeset(%{group_id: group.id, context_id: changes.context.id, access_level: Binding.full_access()})
    end)
    |> Multi.insert(:space_members_binding, fn changes ->
      access_level = Map.get(attrs, :company_permissions, Binding.no_access())
      group = Access.get_group!(company_id: changes.group.company_id, tag: :standard)

      Binding.changeset(%{group_id: group.id, context_id: changes.context.id, access_level: access_level})
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
end
