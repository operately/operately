defmodule OperatelyWeb.Api.Goals.AcknowledgeRetrospective do
  @moduledoc """
  Acknowledges a goal retrospective by goal ID.
  """

  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Activities.Activity
  alias Operately.Goals
  alias Operately.Goals.{Permissions, Retrospective}
  alias Operately.Operations.GoalRetrospectiveAcknowledgement

  require Logger

  inputs do
    field :goal_id, :id, null: false
  end

  outputs do
    field :activity, :activity, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:activity, fn ctx ->
      get_retrospective_activity(ctx.me, inputs.goal_id)
    end)
    |> run(:check_goal_closing, fn ctx -> check_goal_closing(ctx.activity) end)
    |> run(:goal, fn ctx -> load_goal(ctx) end)
    |> run(:check_permissions, fn ctx ->
      Permissions.check(ctx.activity.request_info.access_level, :can_edit, company_read_only: company_read_only(conn))
    end)
    |> run(:check_already_acknowledged, fn ctx -> check_already_acknowledged(ctx.activity) end)
    |> run(:check_not_the_author, fn ctx -> check_not_the_author(ctx.me, ctx.activity) end)
    |> run(:operation, fn ctx ->
      GoalRetrospectiveAcknowledgement.run(ctx.me, ctx.activity, ctx.activity.comment_thread, ctx.goal)
    end)
    |> run(:serialized, fn ctx -> serialize_activity(ctx.activity.id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} ->
        {:ok, ctx.serialized}

      {:error, :check_already_acknowledged, e} ->
        {:ok, serialize_activity(e.context.activity.id) |> elem(1)}

      {:error, :activity, _} ->
        {:error, :not_found}

      {:error, :check_goal_closing, _} ->
        {:error, :not_found}

      {:error, :goal, _} ->
        {:error, :not_found}

      {:error, :check_permissions, _} ->
        {:error, :forbidden}

      {:error, :check_not_the_author, _} ->
        {:error, :bad_request, "Authors cannot acknowledge their own retrospectives"}

      {:error, :operation, _} ->
        {:error, :internal_server_error}

      e ->
        Logger.error("AcknowledgeGoalRetrospective mutation failed: #{inspect(e)}")
        {:error, :internal_server_error}
    end
  end

  defp check_goal_closing(activity) do
    if activity.action == "goal_closing" and activity.comment_thread do
      {:ok, :is_goal_closing}
    else
      {:error, :not_a_goal_closing}
    end
  end

  defp get_retrospective_activity(me, goal_id) do
    with {:ok, activity_id} <- Retrospective.get(goal_id: goal_id) do
      Activity.get(me, id: activity_id, opts: [preload: [:author, :comment_thread]])
    end
  end

  defp load_goal(ctx) do
    case Goals.get_goal(ctx.activity.content["goal_id"]) do
      nil -> {:error, :not_found}
      goal -> {:ok, goal}
    end
  end

  defp check_already_acknowledged(activity) do
    if activity.comment_thread.acknowledged_at do
      {:error, :already_acknowledged}
    else
      {:ok, :can_acknowledge}
    end
  end

  defp check_not_the_author(me, activity) do
    if me.id == activity.author_id do
      {:error, :cant_acknowledge_own_retrospective}
    else
      {:ok, :not_the_author}
    end
  end

  defp serialize_activity(activity_id) do
    activity =
      Activity
      |> Repo.get!(activity_id)
      |> Repo.preload([:author, comment_thread: [:acknowledged_by, reactions: :person]])
      |> Operately.Activities.cast_content()
      |> Operately.Activities.Preloader.preload()

    {:ok, %{activity: OperatelyWeb.Api.Serializers.Activity.serialize(activity, [comment_thread: :full])}}
  end
end
