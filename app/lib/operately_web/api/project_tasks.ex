defmodule OperatelyWeb.Api.ProjectTasks do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Repo
  alias OperatelyWeb.Api.Serializer

  defmodule List do
    use TurboConnect.Query

    inputs do
      field :project_id, :id, null: false
    end

    outputs do
      field :tasks, list_of(:task), null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_tasks()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{tasks: Serializer.serialize(changes.tasks, level: :full)}
      end)
    end
  end

  defmodule UpdateStatus do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :status, :string, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_status(inputs.status)
      |> Steps.save_activity(:task_status_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          task_id: changes.task.id,
          old_status: changes.task.status,
          new_status: changes.updated_task.status
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end
  end

  defmodule UpdateDueDate do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_due_date(inputs.due_date)
      |> Steps.save_activity(:task_due_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          task_id: changes.task.id,
          old_due_date: changes.task.due_date,
          new_due_date: changes.updated_task.due_date
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end
  end

  defmodule UpdateAssignee do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :assignee_id, :id, null: true
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_assignee(inputs.assignee_id)
      |> Steps.save_activity(:task_assignee_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          task_id: changes.task.id,
          old_assignee_id: get_old_assignee_id(changes.task),
          new_assignee_id: inputs.assignee_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end

    defp get_old_assignee_id(task) do
      case task.assigned_people do
        [assignee | _] -> assignee.id
        _ -> nil
      end
    end
  end

  defmodule UpdateMilestone do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :milestone_id, :id, null: true
      field? :index, :integer, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.validate_milestone_belongs_to_project(inputs.milestone_id)
      |> Steps.update_task_milestone_with_ordering(inputs.milestone_id, inputs[:index])
      |> Steps.save_activity(:task_milestone_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          task_id: changes.task.id,
          old_milestone_id: changes.task.milestone_id,
          new_milestone_id: inputs.milestone_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end
  end

  defmodule Create do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :project_id, :id, null: false
      field :milestone_id, :id, null: true
      field :name, :string, null: false
      field :assignee_id, :id, null: true
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.validate_milestone_belongs_to_project(inputs.milestone_id)
      |> Steps.create_task(inputs)
      |> Steps.save_activity(:task_adding, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          name: changes.task.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.task, level: :full)}
      end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger
    import Ecto.Query, only: [from: 2]

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_project(multi, project_id) do
      Ecto.Multi.run(multi, :project, fn _repo, %{me: me} ->
        case Operately.Projects.Project.get(me, id: project_id, opts: [preload: [:access_context]]) do
          {:ok, project} -> {:ok, project}
          {:error, _} -> {:error, {:not_found, "Project not found"}}
        end
      end)
    end

    def find_task(multi, task_id) do
      Ecto.Multi.run(multi, :task, fn _repo, %{me: me} ->
        case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: [:project]]) do
          {:ok, task} -> {:ok, task}
          {:error, _} -> {:error, {:not_found, "Task not found"}}
        end
      end)
      |> Ecto.Multi.run(:project, fn _repo, %{task: task} ->
        {:ok, task.project}
      end)
    end

    def get_tasks(multi) do
      Ecto.Multi.run(multi, :tasks, fn _repo, %{project: project} ->
        tasks =
          from(t in Operately.Tasks.Task,
            where: t.project_id == ^project.id,
            preload: [:assigned_people, :milestone]
          )
          |> Repo.all()

        {:ok, tasks}
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{project: project} ->
        Operately.Projects.Permissions.check(project.request_info.access_level, permission)
      end)
    end

    def check_task_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{task: task} ->
        Operately.Projects.Permissions.check(task.request_info.access_level, permission)
      end)
    end

    def update_task_status(multi, new_status) do
      Ecto.Multi.update(multi, :updated_task, fn %{task: task} ->
        Operately.Tasks.Task.changeset(task, %{status: new_status})
      end)
    end

    def update_task_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_task, fn %{task: task} ->
        Operately.Tasks.Task.changeset(task, %{due_date: new_due_date})
      end)
    end

    def update_task_assignee(multi, new_assignee_id) do
      multi
      |> Ecto.Multi.run(:clear_existing_assignees, fn _repo, %{task: task} ->
        # Remove existing assignees
        Operately.Tasks.list_task_assignees(task)
        |> Enum.each(&Operately.Repo.delete!/1)

        {:ok, :cleared}
      end)
      |> Ecto.Multi.run(:updated_task, fn _repo, %{task: task} ->
        if new_assignee_id do
          {:ok, _} = Operately.Tasks.Assignee.changeset(%{
            task_id: task.id,
            person_id: new_assignee_id
          }) |> Operately.Repo.insert()
        end

        # Return the updated task with preloaded assignees
        updated_task = Operately.Repo.preload(task, :assigned_people)

        {:ok, updated_task}
      end)
    end

    def validate_milestone_belongs_to_project(multi, milestone_id) do
      Ecto.Multi.run(multi, :validate_milestone, fn _repo, %{project: project} ->
        case milestone_id do
          nil ->
            {:ok, nil}
          _ ->
            milestone = Operately.Projects.get_milestone!(milestone_id)
            if milestone.project_id == project.id do
              {:ok, milestone}
            else
              {:error, "Milestone must belong to the same project as the task"}
            end
        end
      end)
    end

    def update_task_milestone_with_ordering(multi, new_milestone_id, index) do
      multi
      |> load_milestones_for_ordering(new_milestone_id)
      |> update_task_milestone(new_milestone_id)
      |> update_milestone_ordering_states(new_milestone_id, index)
    end

    defp load_milestones_for_ordering(multi, new_milestone_id) do
      multi
      |> Ecto.Multi.run(:old_milestone, fn repo, changes ->
        load_milestone_with_lock(repo, changes.task.milestone_id)
      end)
      |> Ecto.Multi.run(:new_milestone, fn repo, _changes ->
        load_milestone_with_lock(repo, new_milestone_id)
      end)
    end

    defp load_milestone_with_lock(_repo, nil), do: {:ok, nil}
    defp load_milestone_with_lock(repo, milestone_id) do
      query = from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")
      case repo.one(query) do
        nil -> {:ok, nil}
        milestone -> {:ok, milestone}
      end
    end

    defp update_task_milestone(multi, new_milestone_id) do
      Ecto.Multi.run(multi, :updated_task, fn _repo, changes ->
        old_milestone_id = changes.task.milestone_id

        # Only update task if milestone actually changed
        if old_milestone_id == new_milestone_id do
          task = Map.put(changes.task, :milestone, changes.validate_milestone)
          {:ok, task}
        else
          {:ok, task} = Operately.Tasks.update_task(changes.task, %{milestone_id: new_milestone_id})
          task = Map.put(task, :milestone, changes.validate_milestone)

          {:ok, task}
        end
      end)
    end

    defp update_milestone_ordering_states(multi, new_milestone_id, index) do
      Ecto.Multi.run(multi, :update_milestone_ordering, fn repo, changes ->
        old_milestone_id = changes.task.milestone_id
        task = changes.task

        cond do
          # Case 1: Milestone didn't change, just reorder within the same milestone
          old_milestone_id == new_milestone_id and old_milestone_id != nil ->
            update_single_milestone_ordering(repo, changes.old_milestone, task, index)

          # Case 2: Task moving from one milestone to another
          old_milestone_id != nil and new_milestone_id != nil ->
            with {:ok, _} <- remove_from_old_milestone_ordering(repo, changes.old_milestone, task),
                 {:ok, _} <- add_to_new_milestone_ordering(repo, changes.new_milestone, task, index) do
              {:ok, :updated}
            end

          # Case 3: Task gaining a milestone (was nil)
          old_milestone_id == nil and new_milestone_id != nil ->
            add_to_new_milestone_ordering(repo, changes.new_milestone, task, index)

          # Case 4: Task losing a milestone (now nil)
          old_milestone_id != nil and new_milestone_id == nil ->
            remove_from_old_milestone_ordering(repo, changes.old_milestone, task)

          # Case 5: No milestone change and both are nil
          true ->
            {:ok, :no_change}
        end
      end)
    end

    defp update_single_milestone_ordering(repo, milestone, task, index) do
      ordering_state = Operately.Tasks.OrderingState.load(milestone.tasks_ordering_state)
      task_index = if index != nil, do: index, else: length(ordering_state)

      updated_ordering = Operately.Tasks.OrderingState.move_task(ordering_state, task, task_index)

      changeset = Operately.Projects.Milestone.changeset(milestone, %{tasks_ordering_state: updated_ordering})
      repo.update(changeset)
    end

    defp remove_from_old_milestone_ordering(repo, old_milestone, task) do
      ordering_state = Operately.Tasks.OrderingState.load(old_milestone.tasks_ordering_state)
      updated_ordering = Operately.Tasks.OrderingState.remove_task(ordering_state, task)

      changeset = Operately.Projects.Milestone.changeset(old_milestone, %{tasks_ordering_state: updated_ordering})
      repo.update(changeset)
    end

    defp add_to_new_milestone_ordering(repo, new_milestone, task, index) do
      ordering_state = Operately.Tasks.OrderingState.load(new_milestone.tasks_ordering_state)
      task_index = if index != nil, do: index, else: length(ordering_state)

      updated_ordering = Operately.Tasks.OrderingState.add_task(ordering_state, task, task_index)

      changeset = Operately.Projects.Milestone.changeset(new_milestone, %{tasks_ordering_state: updated_ordering})
      repo.update(changeset)
    end

    def create_task(multi, inputs) do
      multi
      |> Ecto.Multi.run(:new_task, fn _repo, %{me: me} ->
        Operately.Tasks.Task.changeset(%{
          name: inputs.name,
          description: %{},
          milestone_id: inputs.milestone_id,
          project_id: inputs.project_id,
          creator_id: me.id,
          due_date: inputs.due_date
        })
        |> Repo.insert()
      end)
      |> Ecto.Multi.run(:assignee, fn _repo, %{new_task: new_task} ->
        case inputs.assignee_id do
          nil -> {:ok, nil}
          assignee_id ->
            Operately.Tasks.Assignee.changeset(%{ task_id: new_task.id, person_id: assignee_id })
            |> Repo.insert()
        end
      end)
      |> Ecto.Multi.run(:task, fn _repo, %{new_task: new_task, validate_milestone: milestone} ->
        task = Repo.preload(new_task, :assigned_people) |> Map.put(:milestone, milestone)

        {:ok, task}
      end)
      |> add_task_to_milestone_ordering(inputs.milestone_id)
    end

    defp add_task_to_milestone_ordering(multi, nil), do: multi
    defp add_task_to_milestone_ordering(multi, milestone_id) do
      Ecto.Multi.run(multi, :update_milestone_ordering_for_new_task, fn repo, changes ->
        # Load the milestone with a lock to update its ordering state
        query = from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")

        case repo.one(query) do
          nil -> {:ok, nil}

          milestone ->
            ordering_state = Operately.Tasks.OrderingState.load(milestone.tasks_ordering_state)
            # Add the new task to the end of the ordering
            updated_ordering = Operately.Tasks.OrderingState.add_task(ordering_state, changes.new_task)

            changeset = Operately.Projects.Milestone.changeset(milestone, %{tasks_ordering_state: updated_ordering})
            repo.update(changeset)
        end
      end)
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
    end

    def respond(result, ok_callback, error_callback \\ &handle_error/1) do
      case result do
        {:ok, changes} ->
          {:ok, ok_callback.(changes)}

        {:error, _, :idempotent, changes} ->
          {:ok, ok_callback.(changes)}

        e ->
          error_callback.(e)
      end
    end

    defp handle_error(reason) do
      case reason do
        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, :validate_milestone, message, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, reason, _changes} ->
          Logger.error("Transaction failed: #{inspect(reason)}")
          {:error, :internal_server_error}

        e ->
          Logger.error("Unexpected error: #{inspect(e)}")
          {:error, :internal_server_error}
      end
    end
  end
end
