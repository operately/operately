defmodule OperatelyWeb.Api.Queries.IsSubscribedToResource do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Notifications.Subscription
  import Ecto.Query

  inputs do
    field :resource_id, :id
    field :resource_type, :subscription_parent_type
  end

  outputs do
    field :subscribed, :boolean, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> Action.run(:me, fn -> find_me(conn) end)
    |> Action.run(:resource, fn ctx -> load_resource(ctx, inputs) end)
    |> Action.run(:check_permissions, fn ctx -> check_access(ctx.resource) end)
    |> Action.run(:subscription_status, fn ctx -> check_subscription(ctx.me.id, ctx.resource) end)
    |> Action.run(:serialized, fn ctx -> {:ok, %{subscribed: ctx.subscription_status}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :resource_id, _} -> {:error, :bad_request}
      {:error, :resource, %{error: :invalid_resource_type}} -> {:error, :bad_request}
      {:error, :resource, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :not_found}
    end
  end

  defp load_resource(ctx, %{resource_type: resource_type, resource_id: resource_id}) do
    case resource_type do
      :goal_update ->
        Operately.Goals.Update.get(ctx.me, id: resource_id)

      :project_check_in ->
        Operately.Projects.CheckIn.get(ctx.me, id: resource_id)

      :project_retrospective ->
        Operately.Projects.Retrospective.get(ctx.me, id: resource_id)

      :message ->
        Operately.Messages.Message.get(ctx.me, id: resource_id)

      :resource_hub_document ->
        Operately.ResourceHubs.Document.get(ctx.me, id: resource_id)

      :resource_hub_file ->
        Operately.ResourceHubs.File.get(ctx.me, id: resource_id)

      :resource_hub_link ->
        Operately.ResourceHubs.Link.get(ctx.me, id: resource_id)

      :comment_thread ->
        Operately.Comments.CommentThread.get(ctx.me, id: resource_id)

      :project ->
        Operately.Projects.Project.get(ctx.me, id: resource_id)

      :milestone ->
        Operately.Projects.Milestone.get(ctx.me, id: resource_id)

      :project_task ->
        Operately.Tasks.Task.get(ctx.me, id: resource_id)

      _ ->
        {:error, :invalid_resource_type}
    end
  end

  defp check_access(resource) do
    case resource do
      {:error, _} -> {:error, :not_found}
      resource -> {:ok, resource}
    end
  end

  defp check_subscription(person_id, resource) do
    subscription_list_id = resource.subscription_list_id

    if is_nil(subscription_list_id) do
      {:ok, false}
    else
      subscribed =
        Operately.Repo.exists?(
          from s in Subscription,
            where:
              s.subscription_list_id == ^subscription_list_id and
              s.person_id == ^person_id and
              s.canceled == false
        )

      {:ok, subscribed}
    end
  end
end
