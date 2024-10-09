defmodule OperatelyWeb.Api.Queries.GetGoal do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Goals.{Goal, Permissions}

  inputs do
    field :id, :string

    field :include_champion, :boolean
    field :include_closed_by, :boolean
    field :include_last_check_in, :boolean
    field :include_permissions, :boolean
    field :include_projects, :boolean
    field :include_reviewer, :boolean
    field :include_space, :boolean
    field :include_space_members, :boolean
    field :include_targets, :boolean
    field :include_access_levels, :boolean
    field :include_potential_subscribers, :boolean
    field :include_unread_notifications, :boolean
  end

  outputs do
    field :goal, :goal
  end

  def call(conn, %{id: id} = inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(id) end)
    |> run(:goal, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.requester_access_level, :can_view) end)
    |> run(:serialized, fn ctx -> {:ok, %{goal: Serializer.serialize(ctx.goal, level: :full)}} end)
    |> respond()
  end

  def call(_conn, _) do
    {:error, :bad_request}
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :goal, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs) do
    Goal.get(ctx.me, id: ctx.id, company_id: ctx.me.company_id, opts: [
      with_deleted: true,
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
        include_champion: :champion,
        include_closed_by: :closed_by,
        include_projects: [projects: [:champion, :reviewer]],
        include_reviewer: :reviewer,
        include_space: :group,
        include_space_members: [group: [:members, :company]],
        include_targets: :targets,
        include_potential_subscribers: [:reviewer, :champion, group: :members],
        always_include: :parent_goal,
    ])
  end

  defp after_load(inputs, me) do
    Inputs.parse_includes(inputs, [
      include_last_check_in: &Goal.preload_last_check_in/1,
      include_permissions: load_permissions(me),
      include_access_levels: &Goal.preload_access_levels/1,
      include_potential_subscribers: &Goal.set_potential_subscribers/1,
      include_unread_notifications: load_unread_notifications(me),
    ])
  end

  defp load_permissions(person) do
    fn goal ->
      Goal.preload_permissions(goal, person)
    end
  end

  defp load_unread_notifications(person) do
    fn goal ->
      Goal.load_unread_notifications(goal, person)
    end
  end
end
