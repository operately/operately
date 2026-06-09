defmodule OperatelyWeb.Api.Goals.GetCheckIn do
  @moduledoc """
  Retrieves a goal check-in by ID with optional includes for related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Goals.Update
  alias Operately.Goals.Update.Permissions
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field :id, :id, null: false
    field? :include_author, :boolean, null: true
    field? :include_acknowledged_by, :boolean, null: true
    field? :include_reactions, :boolean, null: true
    field? :include_goal, :boolean, null: true
    field? :include_goal_targets, :boolean, null: true
    field? :include_goal_checklist, :boolean, null: true
    field? :include_reviewer, :boolean, null: true
    field? :include_champion, :boolean, null: true
    field? :include_space, :boolean, null: true
    field? :include_space_members, :boolean, null: true
    field? :include_subscriptions_list, :boolean, null: true
    field? :include_potential_subscribers, :boolean, null: true
    field? :include_unread_notifications, :boolean, null: true
    field? :include_permissions, :boolean, null: true
  end

  outputs do
    field :update, :goal_progress_update, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:update, fn ctx -> load(ctx, inputs, company_read_only(conn)) end)
    |> Action.run(:check_draft_access, fn ctx -> check_draft_access(ctx.update, ctx.me) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.update.request_info.access_level, ctx.update, ctx.me.id, :can_view, company_read_only: company_read_only(conn)) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{update: OperatelyWeb.Api.Serializer.serialize(ctx.update, level: :full)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :update, _} -> {:error, :not_found}
      {:error, :check_draft_access, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load(ctx, inputs, company_read_only) do
    Update.get(ctx.me,
      id: inputs.id,
      opts: [
        preload: preload(inputs),
        auth_preload: auth_preload(inputs),
        after_load: after_load(inputs, ctx.me, company_read_only)
      ]
    )
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs,
      include_author: :author,
      include_acknowledged_by: :acknowledged_by,
      include_reactions: [reactions: :person],
      include_goal: :goal,
      include_goal_targets: [goal: :targets],
      include_champion: [goal: :champion],
      include_reviewer: [goal: :reviewer],
      include_subscriptions_list: :subscription_list,
      include_potential_subscribers: [:access_context, goal: [:champion, :reviewer]]
    )
  end

  defp auth_preload(inputs) do
    Inputs.parse_includes(inputs,
      include_space: [:space],
      include_space_members: [space: [:members, :company]],
      include_potential_subscribers: [space: :members]
    )
  end

  defp after_load(inputs, me, company_read_only) do
    Inputs.parse_includes(inputs,
      include_potential_subscribers: &Update.set_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(me),
      include_permissions: &Update.preload_permissions(&1, nil, nil, company_read_only)
    )
  end

  defp check_draft_access(%{state: :draft, author_id: author_id}, person) when author_id != person.id, do: {:error, :not_found}
  defp check_draft_access(_update, _person), do: {:ok, :allowed}
end
