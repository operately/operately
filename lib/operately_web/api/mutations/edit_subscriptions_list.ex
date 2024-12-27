defmodule OperatelyWeb.Api.Mutations.EditSubscriptionsList do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.{Goals, Projects, Notifications, Groups, ResourceHubs}
  alias Operately.Operations.SubscriptionsListEditing

  inputs do
    field :id, :string
    field :type, :string
    field :send_notifications_to_everyone, :boolean
    field :subscriber_ids, list_of(:string)
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:attrs, fn -> parse_inputs(inputs) end)
    |> run(:list, fn ctx -> Notifications.get_subscription_list_with_access_level(ctx.attrs.id, ctx.attrs.type, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> check_permissions(ctx.attrs.type, ctx.list.requester_access_level) end)
    |> run(:operation, fn ctx -> SubscriptionsListEditing.run(ctx.list, ctx.attrs) end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, _} -> {:ok, %{}}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :list, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_inputs(inputs) do
    {:ok, id} = decode_id(inputs.id)
    {:ok, subscriber_ids} = decode_id(inputs.subscriber_ids)

    {:ok, %{
      id: id,
      type: String.to_existing_atom(inputs.type),
      send_notifications_to_everyone: inputs[:send_notifications_to_everyone] || false,
      subscriber_ids: subscriber_ids,
    }}
  end

  defp check_permissions(type, access_level) do
    case type do
      :project_check_in -> Projects.Permissions.check(access_level, :can_edit_check_in)
      :project_retrospective -> Projects.Permissions.check(access_level, :can_edit_retrospective)
      :goal_update -> Goals.Permissions.check(access_level, :can_edit_check_in)
      :message -> Groups.Permissions.check(access_level, :can_edit_discussions)
      :resource_hub_document -> ResourceHubs.Permissions.check(access_level, :can_edit_document)
      :resource_hub_file -> ResourceHubs.Permissions.check(access_level, :can_edit_file)
      :resource_hub_link -> ResourceHubs.Permissions.check(access_level, :can_edit_link)
    end
  end
end
