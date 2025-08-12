defmodule OperatelyWeb.Api.Projects do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Access.Binding
  alias Operately.Projects.Contributor
  alias Operately.Repo
  alias OperatelyWeb.Api.Serializer

  defmodule ParentGoalSearch do
    use TurboConnect.Query

    inputs do
      field :query, :string, null: false
      field :project_id, :id, null: false
    end

    outputs do
      field :goals, list_of(:goal), null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.find_potential_parent_goals(inputs.query)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{goals: Serializer.serialize(changes.goals, level: :essential)}
      end)
    end
  end

  defmodule GetTasks do
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

  defmodule UpdateDueDate do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_project_due_date(inputs.due_date)
      |> Steps.save_activity(:project_due_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_due_date: Operately.ContextualDates.Timeframe.end_date(changes.project.timeframe),
          new_due_date: Operately.ContextualDates.Timeframe.end_date(changes.updated_project.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateStartDate do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :start_date, :contextual_date, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.update_project_start_date(inputs.start_date)
      |> Steps.save_activity(:project_start_date_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_start_date: Operately.ContextualDates.Timeframe.start_date(changes.project.timeframe),
          new_start_date: Operately.ContextualDates.Timeframe.start_date(changes.updated_project.timeframe)
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateChampion do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :champion_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_contributors)
      |> Steps.update_project_champion(inputs.champion_id)
      |> Steps.save_activity(:project_champion_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_champion_id: changes.current_champion && changes.current_champion.person_id,
          new_champion_id: inputs.champion_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateParentGoal do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :goal_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_goal)
      |> Steps.update_parent_goal(inputs.goal_id)
      |> Steps.save_activity(:project_goal_connection, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          goal_id: inputs.goal_id,
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule UpdateReviewer do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :reviewer_id, :id, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_contributors)
      |> Steps.update_project_reviewer(inputs.reviewer_id)
      |> Steps.save_activity(:project_reviewer_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          old_reviewer_id: changes.current_reviewer && changes.current_reviewer.person_id,
          new_reviewer_id: inputs.reviewer_id
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn _ -> %{success: true} end)
    end
  end

  defmodule CreateMilestone do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :name, :string, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :milestone, :milestone
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Ecto.Multi.run(:milestone, fn _repo, %{project: project} ->
        Operately.Projects.create_milestone(%{
          title: inputs.name,
          project_id: project.id,
          timeframe: %{
            contextual_start_date: nil,
            contextual_end_date: inputs.due_date
          }
        })
      end)
      |> Steps.save_activity(:project_milestone_creation, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          milestone_name: changes.milestone.title
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestone: OperatelyWeb.Api.Serializer.serialize(changes.milestone)}
      end)
    end
  end

  defmodule UpdateMilestone do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :milestone_id, :id, null: false
      field :name, :string, null: false
      field :due_date, :contextual_date, null: true
    end

    outputs do
      field :milestone, :milestone
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit_timeline)
      |> Steps.find_milestone(inputs.milestone_id)
      |> Ecto.Multi.run(:updated_milestone, fn _repo, %{milestone: milestone} ->
        tf = milestone.timeframe || %{}

        Operately.Projects.update_milestone(milestone,  %{
          title: inputs.name,
          timeframe: %{
            contextual_start_date: tf[:contextual_start_date],
            contextual_end_date: inputs.due_date
          }
        })
      end)
      |> Steps.save_activity(:project_milestone_updating, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
          old_milestone_name: changes.milestone.title,
          new_milestone_name: changes.updated_milestone.title,
          old_timeframe: changes.milestone.timeframe,
          new_timeframe: changes.updated_milestone.timeframe
        }
      end)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestone: OperatelyWeb.Api.Serializer.serialize(changes.updated_milestone)}
      end)
    end
  end

  defmodule UpdateTaskStatus do
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

  defmodule CreateTask do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :milestone_id, :id, null: false
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
      |> Steps.find_milestone(inputs.milestone_id)
      |> Steps.check_milestone_permissions(:can_edit_timeline)
      |> Steps.create_task(inputs)
      |> Steps.save_activity(:task_adding, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          milestone_id: changes.milestone.id,
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

  defmodule DeleteProject do
    use TurboConnect.Mutation
    use OperatelyWeb.Api.Helpers

    inputs do
      field :project_id, :id, null: false
    end

    outputs do
      field :project, :project, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_delete)
      |> Steps.delete_discussions(inputs.project_id)
      |> Steps.collect_check_ins(inputs.project_id)
      |> Steps.delete_comments()
      |> Steps.delete_reactions()
      |> Steps.delete_project()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{project: OperatelyWeb.Api.Serializer.serialize(changes.deleted_project)}
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

    def find_milestone(multi, milestone_id) do
      Ecto.Multi.run(multi, :milestone, fn _repo, %{me: me} ->
        case Operately.Projects.Milestone.get(me, id: milestone_id, opts: [preload: [:project]]) do
          {:ok, milestone} -> {:ok, milestone}
          {:error, _} -> {:error, {:not_found, "Milestone not found"}}
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
            join: m in assoc(t, :milestone),
            where: m.project_id == ^project.id,
            preload: [milestone: m]
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

    def check_milestone_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{milestone: milestone} ->
        Operately.Projects.Permissions.check(milestone.request_info.access_level, permission)
      end)
    end

    def check_task_permissions(multi, permission) do
      Ecto.Multi.run(multi, :permissions, fn _repo, %{task: task} ->
        Operately.Projects.Permissions.check(task.request_info.access_level, permission)
      end)
    end

    def update_project_due_date(multi, new_due_date) do
      Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
        cond do
          new_due_date == nil && project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{timeframe: nil})

          project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: nil,
                contextual_end_date: new_due_date
              }
            })

          true ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: project.timeframe.contextual_start_date,
                contextual_end_date: new_due_date
              }
            })
        end
      end)
    end

    def update_project_start_date(multi, new_start_date) do
      Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
        cond do
          new_start_date == nil && project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{timeframe: nil})

          project.timeframe == nil ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: nil
              }
            })

          true ->
            Operately.Projects.Project.changeset(project, %{
              timeframe: %{
                contextual_start_date: new_start_date,
                contextual_end_date: project.timeframe.contextual_end_date
              }
            })
        end
      end)
    end

    def update_project_champion(multi, new_champion_id) do
      multi
      |> Ecto.Multi.run(:current_champion, fn _repo, %{project: project} ->
        champion = Repo.get_by(Contributor, project_id: project.id, role: :champion)
        {:ok, champion}
      end)
      |> Ecto.Multi.run(:handle_current_champion, fn _repo, changes ->
        case changes.current_champion do
          nil -> {:ok, nil}
          current_champion ->
            Contributor.changeset(current_champion, %{role: :contributor})
            |> Repo.update()
        end
      end)
      |> Ecto.Multi.run(:add_new_champion, fn _repo, %{project: project} ->
        case new_champion_id do
          nil ->
            {:ok, nil}
          _ ->
            # Check if this person is already a contributor
            case Repo.get_by(Contributor, project_id: project.id, person_id: new_champion_id) do
              nil ->
                # Create new contributor with champion role
                Contributor.changeset(%{project_id: project.id, person_id: new_champion_id, role: :champion})
                |> Repo.insert()
              existing ->
                # Update existing contributor to champion role
                existing
                |> Contributor.changeset(%{role: :champion})
                |> Repo.update()
            end
        end
      end)
      |> Ecto.Multi.run(:remove_previous_access_binding, fn _repo, %{project: project, current_champion: current_champion} ->
        case current_champion do
          nil -> {:ok, nil}
          # Update binding to remove :champion tag
          champion -> Operately.Access.bind_person(project.access_context, champion.person_id, Binding.full_access(), nil)
        end
      end)
      |> Ecto.Multi.run(:add_new_access_binding, fn _repo, %{project: project} ->
        case new_champion_id do
          nil -> {:ok, nil}
          _ -> Operately.Access.bind_person(project.access_context, new_champion_id, Binding.full_access(), :champion)
        end
      end)
    end

    def find_potential_parent_goals(multi, search_term) do
      Ecto.Multi.run(multi, :goals, fn _repo, %{project: project, me: me} ->
        goals = Operately.Projects.Project.search_potential_parent_goals(project, me, search_term)
        {:ok, goals}
      end)
    end

    def update_parent_goal(multi, goal_id) do
      Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
        Operately.Projects.Project.changeset(project, %{goal_id: goal_id})
      end)
    end

    def update_project_reviewer(multi, new_reviewer_id) do
      multi
      |> Ecto.Multi.run(:current_reviewer, fn _repo, %{project: project} ->
        reviewer = Repo.get_by(Contributor, project_id: project.id, role: :reviewer)
        {:ok, reviewer}
      end)
      |> Ecto.Multi.run(:handle_current_reviewer, fn _repo, changes ->
        case changes.current_reviewer do
          nil -> {:ok, nil}
          current_reviewer ->
            Contributor.changeset(current_reviewer, %{role: :contributor})
            |> Repo.update()
        end
      end)
      |> Ecto.Multi.run(:add_new_reviewer, fn _repo, %{project: project} ->
        case new_reviewer_id do
          nil ->
            {:ok, nil}
          _ ->
            # Check if this person is already a contributor
            case Repo.get_by(Contributor, project_id: project.id, person_id: new_reviewer_id) do
              nil ->
                # Create new contributor with reviewer role
                Contributor.changeset(%{project_id: project.id, person_id: new_reviewer_id, role: :reviewer})
                |> Repo.insert()
              existing ->
                # Update existing contributor to reviewer role
                existing
                |> Contributor.changeset(%{role: :reviewer})
                |> Repo.update()
            end
        end
      end)
      |> Ecto.Multi.run(:remove_previous_access_binding, fn _repo, %{project: project, current_reviewer: current_reviewer} ->
        case current_reviewer do
          nil -> {:ok, nil}
          # Update binding to remove :reviewer tag
          reviewer -> Operately.Access.bind_person(project.access_context, reviewer.person_id, Binding.full_access(), nil)
        end
      end)
      |> Ecto.Multi.run(:add_new_access_binding, fn _repo, %{project: project} ->
        case new_reviewer_id do
          nil -> {:ok, nil}
          _ -> Operately.Access.bind_person(project.access_context, new_reviewer_id, Binding.full_access(), :reviewer)
        end
      end)
    end

    def delete_discussions(multi, project_id) do
      Ecto.Multi.run(multi, :discussions, fn _, _ ->
        {_count, discussions} = Operately.Projects.delete_project_discussions(project_id)
        {:ok, discussions}
      end)
    end

    def collect_check_ins(multi, project_id) do
      Ecto.Multi.run(multi, :check_ins, fn _, _ ->
        check_ins = Operately.Projects.list_check_ins(project_id) |> Enum.map(& &1.id)
        {:ok, check_ins}
      end)
    end

    def delete_comments(multi) do
      Ecto.Multi.run(multi, :comments, fn _, changes ->
        %{discussions: discussion_ids, check_ins: check_in_ids} = changes
        discussion_ids = discussion_ids || []
        check_in_ids = check_in_ids || []

        {_count, comments} = Operately.Updates.delete_comments(discussion_ids ++ check_in_ids)
        {:ok, comments}
      end)
    end

    def delete_reactions(multi) do
      Ecto.Multi.run(multi, :reactions, fn _, changes ->
        %{discussions: discussion_ids, check_ins: check_in_ids, comments: comment_ids} = changes
        discussion_ids = discussion_ids || []
        check_in_ids = check_in_ids || []
        comment_ids = comment_ids || []

        {_count, reactions} = Operately.Updates.delete_reactions(discussion_ids ++ check_in_ids ++ comment_ids)
        {:ok, reactions}
      end)
    end

    def delete_project(multi) do
      Ecto.Multi.run(multi, :deleted_project, fn _, changes ->
        Operately.Projects.delete_project(changes.project)
      end)
    end

    def update_task_status(multi, new_status) do
      Ecto.Multi.update(multi, :updated_task, fn %{task: task} ->
        Operately.Tasks.Task.changeset(task, %{status: new_status})
      end)
    end

    def create_task(multi, inputs) do
      multi
      |> Ecto.Multi.run(:project, fn _repo, %{milestone: milestone} ->
        {:ok, milestone.project}
      end)
      |> Ecto.Multi.run(:task, fn _repo, %{milestone: milestone, me: me} ->
        {:ok, task} =
          Operately.Tasks.Task.changeset(%{
            name: inputs.name,
            description: %{},
            milestone_id: milestone.id,
            creator_id: me.id,
            due_date: inputs.due_date
          })
          |> Repo.insert()

        task = Map.put(task, :milestone, milestone)
        {:ok, task}
      end)
      |> Ecto.Multi.run(:assignee, fn _repo, %{task: task} ->
        case inputs.assignee_id do
          nil -> {:ok, nil}
          assignee_id ->
            Operately.Tasks.Assignee.changeset(%{ task_id: task.id, person_id: assignee_id })
            |> Repo.insert()
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
