defmodule OperatelyWeb.Api.Companies.GetActivity do
  @moduledoc """
  Retrieves an activity by ID with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Activities
  alias Operately.Activities.{Activity, Preloader, Permissions}
  alias Operately.Comments.CommentThread

  inputs do
    field :id, :id, null: false
    field? :include_unread_goal_notifications, :boolean, null: false
    field? :include_unread_project_notifications, :boolean, null: false
    field? :include_permissions, :boolean, null: false
    field? :include_subscriptions_list, :boolean, null: false
    field? :include_potential_subscribers, :boolean, null: false
  end

  outputs do
    field :activity, :activity, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:activity, fn ctx -> load(ctx, inputs, company_read_only(conn)) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.activity.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
    |> run(:serialized, fn ctx -> {:ok, %{activity: serialize(ctx.activity)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :activity, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx, inputs, company_read_only) do
    Activity.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me, company_read_only),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      always_include: [:author, comment_thread: [reactions: :person]],
      include_subscriptions_list: [comment_thread: :subscription_list],
    ])
  end

  defp after_load(inputs, person, company_read_only) do
    Inputs.parse_includes(inputs, [
      always_include: &Activities.cast_content/1,
      always_include: &Preloader.preload/1,
      include_unread_goal_notifications: load_unread_goal_notifications(person),
      include_unread_project_notifications: load_unread_project_notifications(person),
      include_permissions: &Activity.set_permissions(&1, company_read_only),
      include_potential_subscribers: &CommentThread.set_potential_subscribers/1,
    ])
  end

  defp serialize(activity) do
    OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])
  end

  defp load_unread_goal_notifications(person) do
    fn activity ->
      Activity.load_unread_goal_notifications(activity, person)
    end
  end

  defp load_unread_project_notifications(person) do
    fn activity ->
      Activity.load_unread_project_notifications(activity, person)
    end
  end
end
