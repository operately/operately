defmodule OperatelyWeb.Api.Mutations.EditProjectTimeline do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects
  alias Operately.Projects.Permissions
  alias Operately.Projects.EditTimelineOperation

  inputs do
    field :project_id, :string

    field :project_start_date, :date
    field :project_due_date, :date

    field :milestone_updates, list_of(:edit_project_timeline_milestone_update_input)
    field :new_milestones, list_of(:edit_project_timeline_new_milestone_input)
  end

  outputs do
    field :project, :project
  end

  def call(conn, inputs) do
    Action.new()
    |> run(:me, fn -> find_me(conn) end)
    |> run(:id, fn -> decode_id(inputs.project_id) end)
    |> run(:attrs, fn ctx -> parse_attrs(ctx.id, inputs) end)
    |> run(:project, fn ctx -> Projects.get_project_with_access_level(ctx.id, ctx.me.id) end)
    |> run(:check_permissions, fn ctx -> Permissions.check(ctx.project.requester_access_level, :can_edit_timeline) end)
    |> run(:operation, fn ctx -> EditTimelineOperation.run(ctx.me, ctx.project, ctx.attrs) end)
    |> run(:serialized, fn ctx -> {:ok, %{project: Serializer.serialize(ctx.operation)}} end)
    |> respond()
  end

  defp respond(result) do
    case result do
      {:ok, ctx} -> {:ok, ctx.serialized}
      {:error, :id, _} -> {:error, :bad_request}
      {:error, :attrs, _} -> {:error, :bad_request}
      {:error, :project, _} -> {:error, :not_found}
      {:error, :check_permissions, _} -> {:error, :forbidden}
      {:error, :operation, _} -> {:error, :internal_server_error}
      _ -> {:error, :internal_server_error}
    end
  end

  defp parse_attrs(project_id, inputs) do
    {:ok, %{
      project_id: project_id,

      project_start_date: parse_date(inputs.project_start_date),
      project_due_date: inputs[:project_due_date] && parse_date(inputs.project_due_date),

      milestone_updates: Enum.map(inputs.milestone_updates, fn update ->
        {:ok, milestone_id} = decode_id(update.id)

        %{
          milestone_id: milestone_id,
          title: update.title,
          description: update[:description] && Jason.decode!(update.description),
          due_time: parse_date(update.due_time)
        }
      end),

      new_milestones: Enum.map(inputs.new_milestones, fn milestone ->
        %{
          title: milestone.title,
          description: milestone[:description] && Jason.decode!(milestone.description),
          due_time: parse_date(milestone.due_time)
        }
      end)
    }}
  end

  defp parse_date(date) do
    if date do
      NaiveDateTime.new!(date, ~T[00:00:00])
    else
      nil
    end
  end
end
