defmodule Operately.Operations.TaskMoving do
  alias Ecto.Multi
  alias Operately.Repo
  alias Operately.Tasks.Task
  alias Operately.Groups.Group
  alias Operately.Projects.Project
  alias Operately.Activities

  def run(author, task, destination_type, destination) do
    with :ok <- ensure_valid_destination(destination_type, destination),
         :ok <- ensure_different_destination(task, destination_type, destination.id),
         {:ok, moved_task} <- persist_move(author, task, destination_type, destination) do
      {:ok, %{task: moved_task, destination_type: destination_type, destination_id: destination.id}}
    end
  end

  defp ensure_valid_destination(:project, %Project{}), do: :ok
  defp ensure_valid_destination(:space, %Group{}), do: :ok
  defp ensure_valid_destination(_, _), do: {:error, :invalid_destination}

  defp ensure_different_destination(task, :project, destination_id) do
    if task.project_id == destination_id, do: {:error, :bad_request}, else: :ok
  end

  defp ensure_different_destination(task, :space, destination_id) do
    if task.space_id == destination_id, do: {:error, :bad_request}, else: :ok
  end

  defp persist_move(author, task, destination_type, destination) do
    with {:ok, status} <- destination_default_status(destination_type, destination) do
      attrs = move_attrs(destination_type, destination, status)

      Multi.new()
      |> Multi.update(:task, Task.changeset(task, attrs))
      |> Activities.insert_sync(author.id, :task_moving, fn _ ->
        activity_content(task, destination_type, destination)
      end)
      |> Repo.transaction()
      |> Repo.extract_result(:task)
    end
  end

  defp destination_default_status(:project, project = %Project{}) do
    project
    |> Project.get_default_task_status()
    |> status_to_map()
  end

  defp destination_default_status(:space, space = %Group{}) do
    space
    |> Group.get_default_task_status()
    |> status_to_map()
  end

  defp status_to_map(nil), do: {:error, :invalid_task_status}

  defp status_to_map(status) do
    status =
      status
      |> Map.from_struct()
      |> Map.take([:id, :label, :color, :index, :value, :closed])

    case status[:value] do
      nil -> {:error, :invalid_task_status}
      _ -> {:ok, status}
    end
  end

  defp move_attrs(:project, destination, status) do
    %{
      milestone_id: nil,
      project_id: destination.id,
      space_id: nil,
      task_status: status,
    }
  end

  defp move_attrs(:space, destination, status) do
    %{
      milestone_id: nil,
      project_id: nil,
      space_id: destination.id,
      task_status: status,
    }
  end

  defp activity_content(task, destination_type, destination) do
    destination_project_id =
      case destination_type do
        :project -> destination.id
        :space -> nil
      end

    destination_space_id =
      case destination_type do
        :project -> destination.group_id
        :space -> destination.id
      end

    %{
      company_id: company_id(task),
      task_id: task.id,
      project_id: destination_project_id,
      space_id: destination_space_id,
      origin_project_id: task.project_id,
      origin_space_id: origin_space_id(task),
      destination_project_id: destination_project_id,
      destination_space_id: destination_space_id,
      task_name: task.name,
      origin_type: Task.task_type(task),
      destination_type: Atom.to_string(destination_type)
    }
  end

  defp company_id(task) do
    cond do
      task.project && task.project.company_id -> task.project.company_id
      task.space && task.space.company_id -> task.space.company_id
    end
  end

  defp origin_space_id(task) do
    cond do
      task.space_id -> task.space_id
      task.project && task.project.group_id -> task.project.group_id
    end
  end
end
