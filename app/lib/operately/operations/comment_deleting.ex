defmodule Operately.Operations.CommentDeleting do
  alias Ecto.Multi
  alias Operately.{Activities, Repo, Updates}
  alias Operately.Tasks.Task
  alias Operately.Updates.Comment

  def run(author, %Comment{} = comment, parent_type) when parent_type in [:project_task, :space_task] do
    with {:ok, task} <- fetch_task(comment, parent_type) do
      Multi.new()
      |> Multi.delete(:comment, comment)
      |> Activities.insert_sync(
        author.id,
        :task_comment_deleting,
        fn _changes ->
          activity_content(author, comment, task)
        end,
        include_notification: false
      )
      |> Repo.transaction()
      |> Repo.extract_result(:comment)
    end
  end

  def run(_author, %Comment{} = comment, _parent_type) do
    Updates.delete_comment(comment)
  end

  defp fetch_task(comment, :project_task), do: Task.get(:system, id: comment.entity_id, opts: [preload: :project])
  defp fetch_task(comment, :space_task), do: Task.get(:system, id: comment.entity_id, opts: [preload: :space])

  defp activity_content(author, comment, task) do
    %{
      company_id: author.company_id,
      space_id: space_id(task),
      project_id: task.project_id,
      task_id: task.id,
      task_name: task.name,
      comment_id: comment.id
    }
  end

  defp space_id(%Task{project: %Operately.Projects.Project{} = project}), do: project.group_id
  defp space_id(%Task{space_id: space_id}), do: space_id
end
