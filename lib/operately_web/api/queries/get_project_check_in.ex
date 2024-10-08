defmodule OperatelyWeb.Api.Queries.GetProjectCheckIn do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{CheckIn, Project}

  inputs do
    field :id, :string
    field :include_author, :boolean
    field :include_acknowledged_by, :boolean
    field :include_project, :boolean
    field :include_reactions, :boolean
    field :include_subscriptions_list, :boolean
    field :include_potential_subscribers, :boolean
  end

  outputs do
    field :project_check_in, :project_check_in
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
      after_load: after_load(inputs) ++ [load_unread_notifications(ctx.me)],
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_author: [:author],
      include_acknowledged_by: [:acknowledged_by],
      include_project: [project: [:reviewer, [contributors: :person]]],
      include_reactions: [reactions: :person],
      include_subscriptions_list: :subscription_list,
      include_potential_subscribers: [:access_context, project: [contributors: :person]],
    ])
  end

  defp after_load(inputs) do
    Inputs.parse_includes(inputs, [
      include_project: &Project.set_permissions/1,
      include_potential_subscribers: &CheckIn.set_potential_subscribers/1,
    ])
  end

  defp load_unread_notifications(person) do
    fn check_in ->
      CheckIn.load_unread_notifications(check_in, person)
    end
  end
end
