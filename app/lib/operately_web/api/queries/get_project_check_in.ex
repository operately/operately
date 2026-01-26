defmodule OperatelyWeb.Api.Queries.GetProjectCheckIn do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{CheckIn, Project}
  alias Operately.Notifications.UnreadNotificationsLoader

  inputs do
    field :id, :string, null: false
    field? :include_author, :boolean, null: false
    field? :include_acknowledged_by, :boolean, null: false
    field? :include_project, :boolean, null: false
    field? :include_space, :boolean, null: false
    field? :include_reactions, :boolean, null: false
    field? :include_subscriptions_list, :boolean, null: false
    field? :include_potential_subscribers, :boolean, null: false
    field? :include_unread_notifications, :boolean, null: true
  end

  outputs do
    field :project_check_in, :project_check_in, null: false
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:check_in, fn ctx -> load(ctx, inputs) end)
    |> run(:serialized, fn ctx -> {:ok, %{project_check_in: Serializer.serialize(ctx.check_in, level: :full)}} end)
    |> respond()
 end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :check_in, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx, inputs) do
    CheckIn.get(ctx.me, id: ctx.id, opts: [
      preload: preload(inputs),
      auth_preload: auth_preload(inputs),
      after_load: after_load(inputs, ctx.me),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: [:author],
      include_acknowledged_by: [:acknowledged_by],
      include_project: [project: [:champion, :reviewer, [contributors: :person]]],
      include_reactions: [reactions: :person],
      include_subscriptions_list: :subscription_list,
    ])
  end

  defp auth_preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_space: [:space],
    ])
  end

  defp after_load(inputs, person) do
    Inputs.parse_includes(inputs, [
      include_project: &Project.set_permissions/1,
      include_potential_subscribers: &CheckIn.load_potential_subscribers/1,
      include_unread_notifications: UnreadNotificationsLoader.load(person),
    ])
  end
end
