defmodule OperatelyWeb.Api.Mutations.SubscribeToNotifications do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{Goals, Projects, Notifications, Groups, ResourceHubs}
  alias Operately.Operations.NotificationsSubscribing

  inputs do
    field :id, :string
    field :type, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:access_level, fn ctx -> Notifications.get_subscription_list_access_level(ctx.attrs.id, ctx.attrs.type, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.attrs.type, ctx.access_level) end)
    |> run(:operation, fn ctx -> NotificationsSubscribing.run(ctx.me.id, ctx.attrs.id) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :access_level, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, id} = decode_id(inputs.id)
    type = String.to_existing_atom(inputs.type)

    {:ok, %{id: id, type: type}}
  end

  defp check_permissions(type, access_level) do
    case type do
      :project_check_in -> Projects.Permissions.check(access_level, :can_view)
      :project_retrospective -> Projects.Permissions.check(access_level, :can_view)
      :goal_update -> Goals.Permissions.check(access_level, :can_view)
      :message -> Groups.Permissions.check(access_level, :can_view)
      :resource_hub_document -> ResourceHubs.Permissions.check(access_level, :can_view)
      :resource_hub_file -> ResourceHubs.Permissions.check(access_level, :can_view)
    end
  end
end
