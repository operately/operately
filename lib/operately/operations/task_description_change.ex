defmodule Operately.Operations.TaskDescriptionChange do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Activities
  alias Operately.Tasks.Task

  def run(author, task_id, description) do
    task = Operately.Tasks.get_task!(task_id)
    changeset = Task.changeset(task, %{description: description})

    space = from(t in Task,
      join: m in Operately.Projects.Milestone, on: m.id == t.milestone_id,
      join: p in Operately.Projects.Project, on: p.id == m.project_id,
      join: g in Operately.Groups.Group, on: g.id == p.group_id,
      where: t.id == ^task_id,
      select: g
    )
    |> Repo.one()

    Multi.new()
    |> Multi.update(:task, changeset)
    |> Activities.insert_sync(author.id, :task_description_change, fn _changes ->
      %{
        company_id: author.company_id,
        task_id: task.id,
        space_id: space.id,
      }
    end)
    |> Repo.transaction()
    |> Repo.extract_result(:task)
  end
end
