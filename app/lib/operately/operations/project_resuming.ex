defmodule Operately.Operations.ProjectResuming do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Projects
  alias Operately.Activities

  def run(author, project, message \\ nil) do
    # When resuming a project, reset the next check-in to the next Friday
    # to avoid immediate check-in requests for projects that were paused
    next_check_in = Operately.Time.first_friday_from_today()

    changeset = Projects.Project.changeset(project, %{
      status: "active",
      next_check_in_scheduled_at: next_check_in
    })

    Multi.new()
    |> Multi.update(:project, changeset)
    |> Activities.insert_sync(author.id, :project_resuming, fn _changes ->
      activity_content = %{
        company_id: project.company_id,
        space_id: project.group_id,
        project_id: project.id,
      }

      # Add message to activity content if provided
      if message do
        Map.put(activity_content, :message, message)
      else
        activity_content
      end
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end
end
