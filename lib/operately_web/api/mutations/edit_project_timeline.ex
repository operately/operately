defmodule OperatelyWeb.Api.Mutations.EditProjectTimeline do
  use TurboConnect.Mutation
  use OperatelyWeb.Api.Helpers

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
    {:ok, id} = decode_id(inputs.project_id)

    author = me(conn)
    project = Operately.Projects.get_project!(id)

    attrs = %{
      project_id: project.id,

      project_start_date: parse_date(inputs.project_start_date),
      project_due_date: parse_date(inputs.project_due_date),

      milestone_updates: Enum.map(inputs.milestone_updates, fn update ->
        %{
          milestone_id: update.id,
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
    }

    {:ok, project} = Operately.Projects.EditTimelineOperation.run(author, project, attrs)
    {:ok, %{project: OperatelyWeb.Api.Serializer.serialize(project)}}
  end

  defp parse_date(date) do
    if date do
      NaiveDateTime.new!(date, ~T[00:00:00])
    else
      nil
    end
  end
end
