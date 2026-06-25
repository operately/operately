defmodule OperatelyWeb.Api.Projects.GetMilestone do
  @moduledoc """
  Retrieves a project milestone by ID with optional related data.
  """

  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.{Milestone, Permissions}

  inputs do
    field :id, :id, null: false
    field? :include_comments, :boolean, null: false
    field? :include_project, :boolean, null: false
    field? :include_creator, :boolean, null: false
    field? :include_permissions, :boolean, null: false
    field? :include_space, :boolean, null: false
    field? :include_subscription_list, :boolean, null: false
    field? :include_available_statuses, :boolean, null: false
    field? :include_markdown, :boolean, default: false
  end

  outputs do
    field :milestone, :milestone, null: false
    field? :markdown, :string
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:milestone, fn ctx -> load(ctx, inputs, company_read_only(conn)) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.milestone.request_info.access_level, :can_view, company_read_only: company_read_only(conn)) end)
    |> run(:serialized, fn ctx -> serialize(ctx, inputs[:include_markdown]) end)
    |> respond()
  end

  defp serialize(ctx, include_md) do
    json = Serializer.serialize(ctx.milestone)

    if include_md do
      markdown = Operately.MD.Milestone.render(ctx.milestone)

      {:ok, %{milestone: json, markdown: markdown}}
    else
      {:ok, %{milestone: json}}
    end
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

  defp load(ctx, inputs, company_read_only) do
    Milestone.get(ctx.me, id: inputs.id, opts: [
      preload: preload(inputs),
      auth_preload: auth_preload(inputs),
      after_load: after_load(inputs, ctx.me, company_read_only),
    ])
  end

  defp preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_project: :project,
      include_creator: :creator,
      include_comments: [comments: [comment: [:author, reactions: :person]]],
      include_subscription_list: [subscription_list: [subscriptions: :person]],
    ])
  end

  defp auth_preload(inputs) do
    Inputs.parse_includes(inputs, [
      include_space: :space,
    ])
  end

  def after_load(inputs, person, company_read_only) do
    Inputs.parse_includes(inputs, [
      include_permissions: &Milestone.set_permissions(&1, company_read_only),
      include_comments: Milestone.load_comment_notifications(person),
      include_available_statuses: &Milestone.preload_available_statuses/1,
    ])
  end
end
