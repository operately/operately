defmodule OperatelyWeb.Api.Mutations.EditGoalDiscussion do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Activities.Activity
  alias Operately.Goals.Permissions
  alias Operately.Operations.GoalDiscussionEditing

  inputs do
    field? :activity_id, :id, null: true
    field? :title, :string, null: true
    field? :message, :string, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:attrs, fn -> parse_inputs(inputs) end)
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:activity, fn ctx -> load_activity(ctx.me, inputs.activity_id) end)
    |> Action.run(:check_permissions, fn ctx -> Permissions.check(ctx.activity.request_info.access_level, :can_edit) end)
    |> Action.run(:operation, fn ctx -> GoalDiscussionEditing.run(ctx.me, ctx.activity, ctx.attrs) end)
    |> Action.run(:result, fn -> {:ok, %{}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.result}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :activity, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load_activity(author, activity_id) do
    Activity.get(author,
      id: activity_id,
      opts: [
        preload: [:comment_thread]
      ]
    )
  end

  defp parse_inputs(inputs) do
    {:ok, Map.put(inputs, :message, Jason.decode!(inputs.message))}
  end
end
