defmodule OperatelyWeb.Api.Queries.GetSpace do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Groups.{Group, Permissions}
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field? :id, :id, null: true
    field? :include_permissions, :boolean, null: true
    field? :include_members, :boolean, null: true
    field? :include_access_levels, :boolean, null: true
    field? :include_members_access_levels, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
  end

  outputs do
    field? :space, :space, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:space, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.space.request_info.access_level, :can_view) end)
    |> run(:serialized, fn ctx -> {:ok, %{space: Serializer.serialize(ctx.space, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs) do
    Group.get(ctx.me,
      id: inputs.id,
      company_id: ctx.me.company_id,
      opts: [
        preload: preload(inputs),
        after_load: after_load(ctx.me, inputs)
      ]
    )
  end

  defp preload(inputs) do
    members_query = from(m in Operately.People.Person, where: m.type != :ai)

    Inputs.parse_includes(inputs,
      include_members: [members: members_query],
      include_potential_subscribers: [members: members_query],
      always_include: :company
    )
  end

  defp after_load(me, inputs) do
    Inputs.parse_includes(inputs,
      include_permissions: &Group.preload_permissions/1,
      include_access_levels: &Group.preload_access_levels/1,
      include_members_access_levels: &Group.preload_members_access_level/1,
      include_potential_subscribers: &Group.set_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      always_include: preload_is_member(me),
      always_include: &sort_members/1
    )
  end

  defp preload_is_member(person) do
    fn space ->
      Group.load_is_member(space, person)
    end
  end

  defp sort_members(group) when is_list(group.members) do
    %{group | members: Enum.sort_by(group.members, & &1.full_name)}
  end

  defp sort_members(group), do: group
end
