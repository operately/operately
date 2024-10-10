defmodule OperatelyWeb.Api.Queries.GetMilestone do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Milestone, Permissions}

  inputs do
    field :id, :string
    field :include_comments, :boolean
    field :include_project, :boolean
    field :include_permissions, :boolean
  end

  outputs do
    field :milestone, :milestone
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.id) end)
    |> run(:milestone, fn ctx -> load(ctx, inputs) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.milestone.request_info.access_level, :can_view) end)
    |> run(:serialized, fn ctx -> {:ok, %{milestone: Serializer.serialize(ctx.milestone)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :milestone, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :not_found}
      _ -> {:error, :internal_server_error}
    end
  end

  defp load(ctx, inputs) do
    Milestone.get(ctx.me, id: ctx.id, opts: [
      preload: preload(inputs),
      after_load: after_load(inputs, ctx.me),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_project: :project,
      include_comments: [comments: [comment: [:author, reactions: :person]]],
    ])
  end

  def after_load(inputs, person) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Milestone.set_permissions/1,
      include_comments: Milestone.load_comment_notifications(person),
    ])
  end
end
