defmodule OperatelyWeb.Api.Mutations.UpdateMilestone do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.ContextualDates.{Timeframe, ContextualDate}

  inputs do
    field :milestone_id, :string
    field :title, :string
    field :deadline, :contextual_date, null: true
  end

  outputs do
    field? :milestone, :milestone, null: true
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.milestone_id) end)
    |> run(:milestone, fn ctx -> Projects.get_milestone_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.milestone.requester_access_level, :can_edit_milestone) end)
    |> run(:operation, fn ctx -> update_milestone(ctx.milestone, inputs.title, inputs.deadline) end)
    |> run(:serialized, fn ctx -> serialize(ctx.operation) end)
    |> respond()
  end

  def update_milestone(milestone, title, deadline) do
    started_date = Timeframe.start_date(milestone.timeframe) || milestone.inserted_at

    Operately.Projects.update_milestone(milestone, %{
      title: title,
      timeframe: %{
        contextual_start_date: ContextualDate.create_day_date(started_date),
        contextual_end_date: deadline,
      }
    })
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
