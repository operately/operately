defmodule OperatelyWeb.Api.Tasks do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Repo
  alias OperatelyWeb.Api.Serializer
  alias Operately.Tasks.KanbanState
  alias Operately.Tasks.MilestoneSync

  defmodule List do
    use TurboConnect.Query

    inputs do
      field :project_id, :id, null: false
    end

    outputs do
      field :tasks, list_of(:task), null: false
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
      field :status, :task_status, null: true
      field :type, :task_type, null: false
    end

    outputs do
      field :task, :task
      field :updated_milestone, :milestone, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type, [:assigned_people])
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_status(inputs.status)
      |> MilestoneSync.sync_after_status_update()
      |> Steps.save_activity(:task_status_updating, &build_activity_content/1)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{
          task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full),
          updated_milestone: OperatelyWeb.Api.Serializer.serialize(changes.updated_milestone)
        }
      end)
    end

    defp build_activity_content(changes) do
      old_status = changes.task.task_status && Map.from_struct(changes.task.task_status)
      new_status = changes.updated_task.task_status && Map.from_struct(changes.updated_task.task_status)

      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        old_status: old_status,
        new_status: new_status,
        name: changes.task.name
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil
          }, base)
      end
    end
  end

  defmodule UpdateKanban do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :milestone_id, :id, null: true
      field :status, :task_status, null: false
      field :milestone_kanban_state, :json, null: false
    end

    outputs do
      field :task, :task
      field :updated_milestone, :milestone, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, :project, [:assigned_people, :milestone])
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.validate_kanban_milestone(inputs.milestone_id)
      |> Steps.update_task_status(inputs.status)
      |> Steps.update_milestone_kanban_state(inputs.milestone_kanban_state)
      |> Steps.save_activity(:task_status_updating, fn changes ->
        old_status = changes.task.task_status && Map.from_struct(changes.task.task_status)
        new_status = changes.updated_task.task_status && Map.from_struct(changes.updated_task.task_status)

        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.task.milestone_id,
          task_id: changes.task.id,
          old_status: old_status,
          new_status: new_status,
          name: changes.task.name
        }
      end)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{
          task: Serializer.serialize(changes.updated_task, level: :full),
          updated_milestone: Serializer.serialize(changes.kanban_updated_milestone || changes.updated_milestone)
        }
      end)
    end
  end

  defmodule UpdateDescription do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :description, :json, null: false
      field :type, :task_type, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_description(inputs.description)
      |> Steps.save_activity(:task_description_change, &build_activity_content(inputs, &1))
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end

    defp build_activity_content(inputs, changes) do
      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        task_name: changes.task.name,
        has_description: Operately.RichContent.empty?(inputs.description),
        description: inputs.description
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id,
            project_name: changes.project.name
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil,
            project_name: nil
          }, base)
      end
    end
  end

  defmodule UpdateName do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :name, :string, null: false
      field :type, :task_type, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_name(inputs.name)
      |> Steps.save_activity(:task_name_updating, &build_activity_content/1)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end

    defp build_activity_content(changes) do
      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        old_name: changes.task.name,
        new_name: changes.updated_task.name
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil
          }, base)
      end
    end
  end

  defmodule UpdateDueDate do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :due_date, :contextual_date, null: true
      field :type, :task_type, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_due_date(inputs.due_date)
      |> Steps.save_activity(:task_due_date_updating, &build_activity_content/1)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end

    defp build_activity_content(changes) do
      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        task_name: changes.task.name,
        old_due_date: changes.task.due_date,
        new_due_date: changes.updated_task.due_date
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil
          }, base)
      end
    end
  end

  defmodule UpdateAssignee do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :assignee_id, :id, null: true
      field :type, :task_type, null: false
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type, [:assigned_people])
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.update_task_assignee(inputs.assignee_id)
      |> Steps.save_activity(:task_assignee_updating, &build_activity_content(inputs, &1))
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full)}
      end)
    end

    defp build_activity_content(inputs, changes) do
      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        old_assignee_id: get_old_assignee_id(changes.task),
        new_assignee_id: inputs.assignee_id
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil
          }, base)
      end
    end

    defp get_old_assignee_id(task) do
      case task.assigned_people do
        [assignee | _] -> assignee.id
        _ -> nil
      end
    end
  end

  defmodule UpdateMilestoneAndOrdering do
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
      |> Steps.find_task(inputs.task_id, :project)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.validate_milestone_if_changed(inputs.milestone_id)
      |> Steps.update_task_milestone_if_changed(inputs.milestone_id)
      |> MilestoneSync.sync_after_milestone_change(inputs.milestone_id)
      |> MilestoneSync.sync_manual_ordering(inputs.milestones_ordering_state)
      |> save_activity_if_milestone_changed(inputs.milestone_id)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{
            task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full),
            updated_milestones: OperatelyWeb.Api.Serializer.serialize(collect_all_updated_milestones(changes)),
          }
      end)
    end

    defp collect_all_updated_milestones(changes) do
      milestone_change_milestones = Map.get(changes, :milestone_change_sync, [])
      manual_ordering_milestones = Map.get(changes, :milestone_sync_manual, [])

      # Combine and deduplicate by ID
      (milestone_change_milestones ++ manual_ordering_milestones)
      |> Enum.filter(fn milestone -> milestone != nil end)
      |> Enum.uniq_by(& &1.id)
    end

    defp save_activity_if_milestone_changed(multi, new_milestone_id) do
      Ecto.Multi.merge(multi, fn changes ->
        if changes.task.milestone_id != new_milestone_id do
          Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, :task_milestone_updating, fn _ ->
            %{
              company_id: changes.project.company_id,
              space_id: changes.project.group_id,
              project_id: changes.project.id,
              task_id: changes.task.id,
              old_milestone_id: changes.task.milestone_id,
              new_milestone_id: new_milestone_id
            }
          end)
        else
          Ecto.Multi.new()
        end
      end)
    end
  end

  defmodule UpdateMilestone do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :task_id, :id, null: false
      field :milestone_id, :id, null: true
    end

    outputs do
      field :task, :task
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, :project)
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.validate_milestone_if_changed(inputs.milestone_id)
      |> Steps.update_task_milestone_if_changed(inputs.milestone_id)
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
        %{ task: OperatelyWeb.Api.Serializer.serialize(changes.updated_task, level: :full) }
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
      field? :status, :task_status, null: false
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
      |> MilestoneSync.sync_after_task_create(inputs.milestone_id)
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
      |> Steps.broadcast_review_count_update()
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
      field :type, :task_type, null: false
    end

    outputs do
      field :success, :boolean
      field :updated_milestone, :milestone, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_task(inputs.task_id, inputs.type, [:assigned_people])
      |> Steps.check_task_permissions(:can_edit_task)
      |> Steps.delete_task()
      |> MilestoneSync.sync_after_task_delete()
      |> Steps.save_activity(:task_deleting, &build_activity_content/1)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{
          success: true,
          updated_milestone: OperatelyWeb.Api.Serializer.serialize(changes.updated_milestone)
        }
      end)
    end

    defp build_activity_content(changes) do
      base = %{
        milestone_id: changes.task.milestone_id,
        task_id: changes.task.id,
        name: changes.task.name
      }

      cond do
        Map.has_key?(changes, :project) and changes.project ->
          Map.merge(%{
            company_id: changes.project.company_id,
            space_id: changes.project.group_id,
            project_id: changes.project.id
          }, base)

        Map.has_key?(changes, :space) and changes.space ->
          Map.merge(%{
            company_id: changes.space.company_id,
            space_id: changes.space.id,
            project_id: nil
          }, base)
      end
    end
  end

  defmodule SharedMultiSteps do
    require Logger
    import Ecto.Query, only: [from: 2]
    use OperatelyWeb.Api.Helpers
    alias Operately.Operations.Notifications
    alias Operately.Access.Binding
    alias Operately.Projects.Contributor
    alias Operately.Notifications.Subscription

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

    def find_task(multi, task_id, type, preloads \\ []) when type in [:space, :project] do
      multi
      |> Ecto.Multi.run(:task, fn _repo, %{me: me} ->
        preloads = [type] ++ preloads

        case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: preloads]) do
          {:ok, task} -> {:ok, task}
          {:error, _} -> {:error, {:not_found, "Task not found"}}
        end
      end)
      |> Ecto.Multi.run(type, fn _repo, %{task: task} ->
        {:ok, Map.get(task, type)}
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
          |> Operately.Tasks.Task.load_comments_count()

        {:ok, tasks}
      end)
    end

    def check_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, changes ->
        cond do
          Map.has_key?(changes, :project) and Ecto.assoc_loaded?(changes.project) ->
            Operately.Projects.Permissions.check(changes.project.request_info.access_level, permission)

          Map.has_key?(changes, :space) and Ecto.assoc_loaded?(changes.space) ->
            Operately.Groups.Permissions.check(changes.space.request_info.access_level, permission)

          true ->
            {:error, :forbidden}
        end
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
        Operately.Tasks.Task.changeset(task, %{
          task_status: new_status,
          status: new_status.value
        })
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
      |> maybe_add_assignee_contributor(new_assignee_id)
    end

    def delete_task(multi) do
      Ecto.Multi.run(multi, :delete_task, fn repo, %{task: task} ->
        case repo.delete(task) do
          {:ok, deleted_task} -> {:ok, deleted_task}
          {:error, changeset} -> {:error, changeset}
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

    def validate_kanban_milestone(multi, milestone_id) do
      Ecto.Multi.run(multi, :validate_kanban_milestone, fn _repo, %{task: task} ->
        decoded =
          case milestone_id do
            nil -> {:ok, nil}
            _ -> decode_id(milestone_id, :allow_nil)
          end

        case decoded do
          {:ok, decoded_id} ->
            if task.milestone_id == decoded_id do
              {:ok, task.milestone}
            else
              {:error, {:bad_request, "Task milestone mismatch"}}
            end

          {:error, reason} ->
            {:error, {:bad_request, reason}}
        end
      end)
    end

    def update_task_milestone_if_changed(multi, new_milestone_id) do
      Ecto.Multi.run(multi, :updated_task, fn _repo, %{task: task, validate_milestone: milestone} ->
        # Check if milestone_id is different from current task.milestone_id
        if task.milestone_id != new_milestone_id do
          {:ok, updated_task} = Operately.Tasks.update_task(task, %{milestone_id: new_milestone_id})
          {:ok, Map.put(updated_task, :milestone, milestone)}
        else
          # No change needed, return the existing task
          {:ok, task}
        end
      end)
    end

    def update_milestone_kanban_state(multi, kanban_state) do
      Ecto.Multi.run(multi, :kanban_updated_milestone, fn _repo, %{task: task, project: project} ->
        case task.milestone do
          nil ->
            {:ok, nil}

          milestone ->
            allowed_statuses = Operately.Projects.Project.task_status_values(project)

            with {:ok, decoded_state} <- decode_kanban_state(kanban_state, allowed_statuses) do
              next_state = KanbanState.load(decoded_state, allowed_statuses)

              Operately.Projects.update_milestone(milestone, %{tasks_kanban_state: next_state})
            end
        end
      end)
    end

    def create_task(multi, inputs) do
      multi
      |> Notifications.SubscriptionList.insert(%{send_to_everyone: false, subscription_parent_type: :project_task})
      |> Ecto.Multi.run(:new_task, fn _repo, changes ->
        with {:ok, status} <- validate_or_get_default_status(changes.project, inputs[:status]) do
          Operately.Tasks.Task.changeset(%{
            name: inputs.name,
            description: %{},
            milestone_id: inputs.milestone_id,
            project_id: inputs.project_id,
            creator_id: changes.me.id,
            due_date: inputs.due_date,
            subscription_list_id: changes.subscription_list.id,
            task_status: status,
            status: status.value
          })
          |> Repo.insert()
        end
      end)
      |> Notifications.SubscriptionList.update(:new_task)
      |> Ecto.Multi.run(:assignee, fn _repo, %{new_task: new_task} ->
        case inputs.assignee_id do
          nil ->
            {:ok, nil}

          assignee_id ->
            Operately.Tasks.Assignee.changeset(%{task_id: new_task.id, person_id: assignee_id})
            |> Repo.insert()
        end
      end)
      |> maybe_add_assignee_contributor(inputs.assignee_id)
      |> Ecto.Multi.run(:task, fn _repo, %{new_task: new_task, validate_milestone: milestone} ->
        task = Repo.preload(new_task, :assigned_people) |> Map.put(:milestone, milestone)

        {:ok, task}
      end)
    end

    defp maybe_add_assignee_contributor(multi, nil), do: multi

    defp maybe_add_assignee_contributor(multi, assignee_id) do
      Ecto.Multi.run(multi, :assignee_contributor, fn _repo, changes ->
        cond do
          Map.has_key?(changes, :project) and changes.project ->
            ensure_project_contributor(changes.project, assignee_id)

          Map.has_key?(changes, :space) and changes.space ->
            # Space tasks don't need contributor management
            {:ok, :skipped}

          true ->
            {:ok, :skipped}
        end
      end)
    end

    defp ensure_project_contributor(project, assignee_id) do
      case Operately.Repo.get_by(Contributor, project_id: project.id, person_id: assignee_id) do
        nil ->
          access_group = Operately.Access.get_group!(person_id: assignee_id)

          Ecto.Multi.new()
          |> Ecto.Multi.insert(
            :contributor,
            Contributor.changeset(%{
              project_id: project.id,
              person_id: assignee_id,
              responsibility: "contributor"
            })
          )
          |> Ecto.Multi.run(:context, fn _, _ ->
            {:ok, Operately.Access.get_context!(project_id: project.id)}
          end)
          |> Operately.Access.insert_binding(:contributor_binding, access_group, Binding.edit_access())
          |> Ecto.Multi.run(:subscription, fn _repo, _ ->
            ensure_subscription(project.subscription_list_id, assignee_id)
          end)
          |> Operately.Repo.transaction()
          |> Operately.Repo.extract_result(:contributor)

        contributor ->
          {:ok, contributor}
      end
    end

    defp ensure_subscription(nil, _person_id), do: {:ok, nil}

    defp ensure_subscription(subscription_list_id, person_id) do
      case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
        {:error, :not_found} ->
          Operately.Notifications.create_subscription(%{
            subscription_list_id: subscription_list_id,
            person_id: person_id,
            type: :invited
          })

        {:ok, subscription} ->
          Operately.Notifications.update_subscription(subscription, %{canceled: false})
      end
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    defp validate_or_get_default_status(project, nil) do
      {:ok, Map.from_struct(Operately.Projects.Project.get_default_task_status(project))}
    end

    defp validate_or_get_default_status(project, status) do
      if Enum.any?(project.task_statuses, fn s -> s.id == status.id end) do
        {:ok, status}
      else
        {:error, {:bad_request, "Invalid status"}}
      end
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

    def broadcast_review_count_update(result) do
      case result do
        {:ok, changes} ->
          broadcast(changes[:task])
          broadcast(changes[:updated_task])

        _result ->
          :ok
      end

      result
    end

    defp broadcast(task = %Operately.Tasks.Task{}) do
      Enum.each(task.assigned_people, fn person ->
        OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person.id)
      end)
    end

    defp broadcast(_), do: :ok

    defp decode_kanban_state(state, allowed_statuses) when is_map(state) do
      normalized =
        Enum.into(state, %{}, fn {key, value} ->
          {to_string(key), value || []}
        end)

      statuses =
        case allowed_statuses do
          [] -> Map.keys(normalized)
          allowed -> allowed
        end

      with :ok <- validate_statuses(normalized, statuses) do
        {:ok,
         Enum.reduce(statuses, %{}, fn status, acc ->
           Map.put(acc, status, Map.get(normalized, status, []))
         end)}
      end
    end

    defp decode_kanban_state(_state, _allowed_statuses), do: {:ok, %{}}

    defp validate_statuses(_state, []), do: :ok

    defp validate_statuses(state, allowed_statuses) do
      allowed = MapSet.new(Enum.map(allowed_statuses, &to_string/1))

      case Enum.find(Map.keys(state), fn status -> not MapSet.member?(allowed, status) end) do
        nil -> :ok
        invalid -> {:error, {:bad_request, "Invalid status #{invalid}"}}
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

        {:error, _failed_operation, {:bad_request, message}, _changes} ->
          {:error, :bad_request, message}

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
