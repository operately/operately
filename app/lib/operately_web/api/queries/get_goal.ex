defmodule OperatelyWeb.Api.Queries.GetGoal do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias OperatelyWeb.Api.Serializer
  alias Operately.Goals.{Goal, Permissions, Target}
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field :id, :id

    field? :include_champion, :boolean, null: true
    field? :include_closed_by, :boolean, null: true
    field? :include_last_check_in, :boolean, null: true
    field? :include_permissions, :boolean, null: true
    field? :include_projects, :boolean, null: true
    field? :include_reviewer, :boolean, null: true
    field? :include_space, :boolean, null: true
    field? :include_space_members, :boolean, null: true
    field? :include_access_levels, :boolean, null: true
    field? :include_privacy, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
    field? :include_retrospective, :boolean, null: true
    field? :include_checklist, :boolean
    field? :include_markdown, :boolean, default: false
  end

  outputs do
    field? :goal, :goal
    field? :markdown, :string
  end

  def call(conn, %{id: _id} = inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:goal, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.goal.request_info.access_level, :can_view) end)
    |> run(:serialized, fn ctx -> serialize(ctx, inputs.include_markdown) end)
    |> respond()
  end

  def serialize(ctx, include_md) do
    json = Serializer.serialize(ctx.goal, level: :full)

    if include_md do
      markdown = Operately.MD.Goal.render(ctx.goal)

      {:ok, %{goal: json, markdown: markdown}}
    else
      {:ok, %{goal: json}}
    end
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
    Goal.get(ctx.me,
      id: inputs.id,
      company_id: ctx.me.company_id,
      opts: [
        with_deleted: true,
        preload: preload(inputs),
        after_load: after_load(inputs, ctx.me)
      ]
    )
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs,
      include_champion: :champion,
      include_closed_by: :closed_by,
      include_projects: [projects: [:champion, :reviewer]],
      include_reviewer: :reviewer,
      include_space: :group,
      include_space_members: [group: [:members, :company]],
      include_potential_subscribers: [:reviewer, :champion, group: :members],
      include_last_check_in: [last_update: [:author, [reactions: :person]]],
      include_checklist: [:checks],
      always_include: [targets: from(t in Target, order_by: t.index)],
      always_include: :parent_goal
    )
  end

  defp after_load(inputs, me) do
    Inputs.parse_includes(inputs,
      include_permissions: &Goal.preload_permissions/1,
      include_access_levels: &Goal.preload_access_levels/1,
      include_privacy: &Goal.load_privacy/1,
      include_potential_subscribers: &Goal.set_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      include_last_check_in: &Goal.load_last_check_in_permissions/1,
      include_retrospective: &Goal.load_retrospective/1
    )
  end
end
