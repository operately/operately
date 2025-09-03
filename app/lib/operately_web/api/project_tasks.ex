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

  defmodule GetOpenTaskCount do
    use TurboConnect.Query

    inputs do
      field :id, :id, null: false
      field? :use_task_id, :boolean, null: false
      field? :use_milestone_id, :boolean, null: false
    end

    outputs do
      field :count, :integer, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> find_project(inputs)
      |> check_permissions(inputs)
      |> Steps.count_open_tasks()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{count: changes.open_tasks_count}
      end)
    end

    defp find_project(multi, inputs) do
      cond do
        Map.get(inputs, :use_task_id, false) -> Steps.find_project_by_task(multi, inputs.id)
        Map.get(inputs, :use_milestone_id, false) -> Steps.find_project_by_milestone(multi, inputs.id)
        true -> Steps.find_project(multi, inputs.id)
      end
    end

    defp check_permissions(multi, inputs) do
      cond do
        Map.get(inputs, :use_task_id, false) -> Steps.check_task_permissions(multi, :can_view)
        Map.get(inputs, :use_milestone_id, false) -> Steps.check_milestone_permissions(multi, :can_view)
        true -> Steps.check_permissions(multi, :can_view)
      end
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
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          old_status: changes.task.status,
          new_status: changes.updated_task.status,
          name: changes.task.name
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :description, :json, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_description(inputs.description)
      |> Steps.save_activity(:task_description_change, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          project_name: changes.project.name,
          task_name: changes.task.name,
          has_description: Operately.RichContent.empty?(inputs.description)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end
  end

  defmodule UpdateName do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :name, :string, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_name(inputs.name)
      |> Steps.save_activity(:task_name_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          old_name: changes.task.name,
          new_name: changes.updated_task.name
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
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          task_name: changes.task.name,
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
      |> Steps.find_task(inputs.task_id, [:assigned_people])
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_assignee(inputs.assignee_id)
      |> Steps.save_activity(:task_assignee_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
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
      field :milestones_ordering_state, list_of(:edit_milestone_ordering_state_input), null: false
    end

    outputs do
      field :task, :task
      field :updated_milestones, list_of(:milestone)
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.validate_milestone_if_changed(inputs.milestone_id)
      |> Steps.update_task_milestone_if_changed(inputs.milestone_id)
      |> Steps.load_milestones_for_ordering(inputs.milestones_ordering_state)
      |> Steps.validate_milestone_ordering_tasks(inputs.milestones_ordering_state)
      |> Steps.update_milestones_ordering_states(inputs.milestones_ordering_state)
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
        %{
            task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full),
            updated_milestones: OperatelyWeb.Api.Serializer.serialize(changes.updated_milestones),
          }
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
      field :task, :task, null: false
      field :updated_milestone, :milestone, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.validate_milestone_belongs_to_project(inputs.milestone_id)
      |> Steps.create_task(inputs)
      |> Steps.add_task_to_milestone_ordering(inputs.milestone_id)
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
        %{
          task: OperatelyWeb.Api.Serializer.serialize(changes.task, level: :full),
          updated_milestone: changes[:updated_milestone] && OperatelyWeb.Api.Serializer.serialize(changes.updated_milestone)
        }
      end)
    end
  end

  defmodule Delete do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
    end

    outputs do
      field :success, :boolean
      field :updated_milestone, :milestone, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.remove_task_from_milestone_ordering()
      |> Steps.delete_task()
      |> Steps.save_activity(:task_deleting, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          name: changes.task.name,
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{
          success: true,
          updated_milestone: changes[:updated_milestone] && OperatelyWeb.Api.Serializer.serialize(changes.updated_milestone)
        }
      end)
    end
  end

  defmodule SharedMultiSteps do
    require Logger
    import Ecto.Query, only: [from: 2]
    use OperatelyWeb.Api.Helpers

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

    def find_task(multi, task_id, preloads \\ []) do
      Ecto.Multi.run(multi, :task, fn _repo, %{me: me} ->
        preloads = [:project] ++ preloads

        case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: preloads]) do
          {:ok, task} -> {:ok, task}
          {:error, _} -> {:error, {:not_found, "Task not found"}}
        end
      end)
      |> Ecto.Multi.run(:project, fn _repo, %{task: task} ->
        {:ok, task.project}
      end)
    end

    def find_project_by_task(multi, task_id) do
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

    def find_project_by_milestone(multi, milestone_id) do
      Ecto.Multi.run(multi, :milestone, fn _repo, %{me: me} ->
        case Operately.Projects.Milestone.get(me, id: milestone_id, opts: [preload: [:project]]) do
          {:ok, milestone} -> {:ok, milestone}
          {:error, _} -> {:error, {:not_found, "Milestone not found"}}
        end
      end)
      |> Ecto.Multi.run(:project, fn _repo, %{milestone: milestone} ->
        {:ok, milestone.project}
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

    def count_open_tasks(multi) do
      Ecto.Multi.run(multi, :open_tasks_count, fn repo, %{project: project} ->
        # This query counts tasks where:
        # 1. The task belongs to the specified project
        # 2. The task status is not 'done' and not 'canceled'
        # 3. Either the task has no milestone OR its milestone status is not 'done'
        query = from(t in Operately.Tasks.Task,
          left_join: m in Operately.Projects.Milestone, on: t.milestone_id == m.id,
          where: t.project_id == ^project.id and
            t.status not in ["done", "canceled"] and
            (is_nil(t.milestone_id) or m.status != :done),
          select: count(t.id)
        )

        count = repo.one(query)
        {:ok, count || 0}
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

    def check_milestone_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{milestone: milestone} ->
        Operately.Projects.Permissions.check(milestone.request_info.access_level, permission)
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

    def update_task_name(multi, new_name) do
      Ecto.Multi.update(multi, :updated_task, fn %{task: task} ->
        Operately.Tasks.Task.changeset(task, %{name: new_name})
      end)
    end

    def update_task_description(multi, description) do
      Ecto.Multi.update(multi, :updated_task, fn %{task: task} ->
        Operately.Tasks.Task.changeset(task, %{description: description})
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
        updated_task = Operately.Repo.preload(task, :assigned_people, force: true)

        {:ok, updated_task}
      end)
    end

    def delete_task(multi) do
      Ecto.Multi.run(multi, :delete_task, fn repo, %{task: task} ->
        case repo.delete(task) do
          {:ok, deleted_task} -> {:ok, deleted_task}
          {:error, changeset} -> {:error, changeset}
        end
      end)
    end

    def remove_task_from_milestone_ordering(multi) do
      Ecto.Multi.run(multi, :updated_milestone, fn repo, %{task: task} ->
        case task.milestone_id do
          nil -> {:ok, nil}
          milestone_id ->
            query = from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")

            case repo.one(query) do
              nil -> {:ok, nil}

              milestone ->
                ordering_state = Operately.Tasks.OrderingState.load(milestone.tasks_ordering_state)
                updated_ordering = Operately.Tasks.OrderingState.remove_task(ordering_state, task)

                changeset = Operately.Projects.Milestone.changeset(milestone, %{tasks_ordering_state: updated_ordering})
                repo.update(changeset)
            end
        end
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

    def validate_milestone_if_changed(multi, new_milestone_id) do
      Ecto.Multi.run(multi, :validate_milestone, fn _repo, %{task: task, project: project} ->
        # Only validate if milestone is changing
        if task.milestone_id != new_milestone_id do
          case new_milestone_id do
            nil ->
              {:ok, nil}
            _ ->
              milestone = Operately.Projects.get_milestone!(new_milestone_id)
              if milestone.project_id == project.id do
                {:ok, milestone}
              else
                {:error, "Milestone must belong to the same project as the task"}
              end
          end
        else
          # No change, no validation needed
          {:ok, nil}
        end
      end)
    end

    def update_task_milestone_if_changed(multi, new_milestone_id) do
      Ecto.Multi.run(multi, :updated_task, fn _repo, %{task: task} ->
        # Check if milestone_id is different from current task.milestone_id
        if task.milestone_id != new_milestone_id do
          {:ok, updated_task} = Operately.Tasks.update_task(task, %{milestone_id: new_milestone_id})
          {:ok, updated_task}
        else
          # No change needed, return the existing task
          {:ok, task}
        end
      end)
    end

    def load_milestones_for_ordering(multi, milestones_ordering_state) do
      Ecto.Multi.run(multi, :milestones_for_ordering, fn repo, _changes ->
        milestone_ids = Enum.map(milestones_ordering_state, & &1.milestone_id)

        milestones = Enum.map(milestone_ids, fn milestone_id ->
          query = from(m in Operately.Projects.Milestone, where: m.id == ^milestone_id, lock: "FOR UPDATE")
          repo.one(query)
        end)

        {:ok, milestones}
      end)
    end

    def validate_milestone_ordering_tasks(multi, milestones_ordering_state) do
      Ecto.Multi.run(multi, :filtered_ordering_states, fn repo, _changes ->
        # Process each milestone ordering state and filter out invalid tasks
        filtered_states = Enum.map(milestones_ordering_state, fn state ->
          case state.ordering_state do
            nil -> state
            [] -> state
            ordering ->
              {:ok, task_ids} = decode_id(ordering)

              valid_tasks =
                from(t in Operately.Tasks.Task,
                  where: t.id in ^task_ids,
                  where: t.milestone_id == ^state.milestone_id and t.status not in ["done", "canceled"]
                )
                |> repo.all()

              # Create a set of valid encoded IDs for efficient lookup
              valid_encoded_ids = Enum.map(valid_tasks, &OperatelyWeb.Paths.task_id/1) |> MapSet.new()
              filtered_ordering = Enum.filter(ordering, &MapSet.member?(valid_encoded_ids, &1))

              %{state | ordering_state: filtered_ordering}
          end
        end)

        {:ok, filtered_states}
      end)
    end

    def update_milestones_ordering_states(multi, _original_ordering_state) do
      Ecto.Multi.run(multi, :updated_milestones, fn repo, %{milestones_for_ordering: milestones, filtered_ordering_states: filtered_states} ->
        updated_milestones =
          Enum.zip(filtered_states, milestones)
          |> Enum.map(fn {ordering_input, milestone} ->
            {:ok, updated_milestone} = Operately.Projects.Milestone.changeset(milestone, %{
              tasks_ordering_state: ordering_input.ordering_state
            })
            |> repo.update()

            updated_milestone
          end)

        {:ok, updated_milestones}
      end)
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
    end

    def add_task_to_milestone_ordering(multi, nil), do: multi
    def add_task_to_milestone_ordering(multi, milestone_id) do
      Ecto.Multi.run(multi, :updated_milestone, fn repo, changes ->
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
