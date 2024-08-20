defmodule OperatelyWeb.Api.Mutations.UpdateMilestone do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers
  
  alias Operately.Projects
  alias Operately.Projects.Permissions

  inputs do
    field :milestone_id, :string
    field :title, :string
    field :deadline_at, :string
  end

  outputs do
    field :milestone, :milestone
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.milestone_id) end)
    |> run(:deadline, fn -> decode_date(inputs.deadline_at) end)
    |> run(:milestone, fn ctx -> Projects.get_milestone_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.milestone.requester_access_level, :can_edit_milestone) end)
    |> run(:operation, fn ctx -> update_milestone(ctx.milestone, inputs.title, ctx.deadline) end)
    |> run(:serialized, fn ctx -> serialize(ctx.operation) end)
    |> respond()
  end

  def decode_date(date) do
    with {:ok, date} <- Date.from_iso8601(date) do
      NaiveDateTime.new(date, ~T[00:00:00])
    end
  end

  def update_milestone(milestone, title, deadline) do
    Operately.Projects.update_milestone(milestone, %{title: title, deadline_at: deadline})
  end

  def serialize(milestone) do
    milestone = Operately.Repo.preload(milestone, :project)
    {:ok, %{milestone: Serializer.serialize(milestone)}}
  end

  def respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :milestone, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end
end
