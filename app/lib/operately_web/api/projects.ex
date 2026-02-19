defmodule OperatelyWeb.Api.Projects do
  alias __MODULE__.SharedMultiSteps, as: Steps

  alias Operately.Access.Binding
  alias Operately.Projects.Contributor
  alias Operately.Repo
  alias OperatelyWeb.Api.Serializer

  defmodule GetContributors do
    use TurboConnect.Query

    inputs do
      field :project_id, :id, null: false
      field? :query, :string, null: true
      field? :ignored_ids, list_of(:id), null: true
    end

    outputs do
      field :contributors, list_of(:person), null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_contributors(inputs)
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{contributors: Serializer.serialize(changes.contributors, level: :essential)}
      end)
    end
  end

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

  defmodule GetMilestones do
    use TurboConnect.Query

    inputs do
      field :project_id, :id, null: false
      field? :query, :string, null: false
    end

    outputs do
      field :milestones, list_of(:milestone), null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_view)
      |> Steps.get_milestones(inputs[:query])
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{milestones: Serializer.serialize(changes.milestones)}
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
      |> Steps.check_permissions(:can_edit)
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

  defmodule UpdateKanban do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :task_id, :id, null: false
      field :status, :task_status, null: false
      field :kanban_state, :json, null: false
    end

    outputs do
      field :project, :project, null: false
      field :task, :task, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.find_task(inputs.task_id)
      |> Steps.check_task_permissions(:can_edit)
      |> Steps.update_kanban(inputs.status, inputs.kanban_state)
      |> Steps.commit()
      |> Steps.broadcast_review_count_update()
      |> Steps.respond(fn changes ->
        %{
          project: Serializer.serialize(changes.updated_project, level: :essential),
          task: Serializer.serialize(changes.updated_task_with_preloads, level: :full)
        }
      end)
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
      |> Steps.check_permissions(:can_edit)
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

  defmodule UpdateTaskStatuses do
    use TurboConnect.Mutation

    inputs do
      field :project_id, :id, null: false
      field :task_statuses, list_of(:task_status), null: false
      field? :deleted_status_replacements, list_of(:deleted_status_replacement), null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      replacements = inputs[:deleted_status_replacements] || []

      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id)
      |> Steps.check_permissions(:can_edit)
      |> Steps.validate_status_replacements(inputs.task_statuses, replacements)
      |> Steps.update_task_statuses(inputs.task_statuses)
      |> Steps.replace_deleted_task_statuses(replacements)
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
      |> Steps.check_permissions(:has_full_access)
      |> Steps.update_project_champion(inputs.champion_id)
      |> Steps.create_subscription(inputs.champion_id)
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
      field :goal_name, :string, null: true
    end

    outputs do
      field :success, :boolean, null: true
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> Steps.find_project(inputs.project_id, [:goal])
      |> Steps.check_permissions(:can_edit)
      |> Steps.update_parent_goal(inputs.goal_id)
      |> Steps.find_previous_goal()
      |> Steps.save_activity(:project_goal_connection, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          goal_id: inputs.goal_id,
          goal_name: inputs.goal_name,
          previous_goal_id: changes.previous_goal && changes.previous_goal.id,
          previous_goal_name: changes.previous_goal && changes.previous_goal.name,
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
      |> Steps.check_permissions(:has_full_access)
      |> Steps.update_project_reviewer(inputs.reviewer_id)
      |> Steps.create_subscription(inputs.reviewer_id)
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
      |> Steps.find_project(inputs.project_id, [:champion])
      |> Steps.check_permissions(:can_create_milestone)
      |> Steps.create_milestone(inputs)
      |> Steps.add_milestone_to_ordering_state()
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
      |> Steps.broadcast_review_count_update()
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
      |> Steps.check_permissions(:can_edit)
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

  defmodule CountChildren do
    use TurboConnect.Query

    inputs do
      field :id, :id, null: false
      field? :use_task_id, :boolean, null: false
      field? :use_milestone_id, :boolean, null: false
    end

    outputs do
      field :children_count, :project_children_count, null: false
    end

    def call(conn, inputs) do
      conn
      |> Steps.start_transaction()
      |> find_project(inputs)
      |> check_permissions(inputs)
      |> Steps.count_discussions()
      |> Steps.count_open_tasks()
      |> Steps.count_check_ins()
      |> Steps.commit()
      |> Steps.respond(fn changes ->
        %{
          children_count: %{
            discussions_count: changes.discussions_count,
            tasks_count: changes.open_tasks_count,
            check_ins_count: changes.check_ins_count
          },
        }
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

  defmodule SharedMultiSteps do
    require Logger
    import Ecto.Query, only: [from: 2]
    alias Operately.Projects.{Contributor, OrderingState}
    alias Operately.Notifications.{Subscription, SubscriptionList}
    alias Operately.Operations.Notifications.SubscriptionList, as: SubscriptionListOps

    def start_transaction(conn) do
      Ecto.Multi.new()
      |> Ecto.Multi.put(:conn, conn)
      |> Ecto.Multi.run(:me, fn _repo, %{conn: conn} ->
        {:ok, conn.assigns.current_person}
      end)
    end

    def find_project(multi, project_id, preloads \\ []) do
      Ecto.Multi.run(multi, :project, fn _repo, %{me: me} ->
        preloads = [:access_context] ++ preloads

        case Operately.Projects.Project.get(me, id: project_id, opts: [preload: preloads]) do
          {:ok, project} -> {:ok, project}
          {:error, _} -> {:error, {:not_found, "Project not found"}}
        end
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

    def find_task(multi, task_id) do
      Ecto.Multi.run(multi, :task, fn _repo, %{me: me} ->
        case Operately.Tasks.Task.get(me, id: task_id, opts: [preload: [:project]]) do
          {:ok, task} -> {:ok, task}
          {:error, _} -> {:error, {:not_found, "Task not found"}}
        end
      end)
    end

    def update_kanban(multi, status, kanban_state) do
      Ecto.Multi.merge(multi, fn %{me: me, project: project, task: task} ->
        Operately.Operations.KanbanStateUpdating.run(me, %{type: :project, project: project}, task, status, kanban_state)
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

    def find_milestone(multi, milestone_id) do
      Ecto.Multi.run(multi, :milestone, fn _repo, %{me: me} ->
        case Operately.Projects.Milestone.get(me, id: milestone_id, opts: [preload: [:project]]) do
          {:ok, milestone} -> {:ok, milestone}
          {:error, _} -> {:error, {:not_found, "Milestone not found"}}
        end
      end)
    end

    def get_milestones(multi, query) do
      Ecto.Multi.run(multi, :milestones, fn _repo, %{project: project} ->
        base_query = from(m in Operately.Projects.Milestone,
          where: m.project_id == ^project.id,
          order_by: [asc: m.inserted_at]
        )

        query = case query do
          nil -> base_query
          "" -> base_query
          search_str -> from(m in base_query, where: ilike(m.title, ^"%#{search_str}%"))
        end

        {:ok, Repo.all(query)}
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

    def count_discussions(multi) do
      Ecto.Multi.run(multi, :discussions_count, fn _repo, %{project: project} ->
        count =
          from(ct in Operately.Comments.CommentThread,
            where: ct.parent_type == :project and ct.parent_id == ^project.id
          )
          |> Repo.aggregate(:count)

        {:ok, count}
      end)
    end

    def count_open_tasks(multi) do
      Ecto.Multi.run(multi, :open_tasks_count, fn _repo, %{project: project} ->
        # This query counts tasks where:
        # 1. The task belongs to the specified project
        # 2. The task is not closed
        # 3. Either the task has no milestone OR its milestone status is not 'done'
        query = from(t in Operately.Tasks.Task,
          left_join: m in Operately.Projects.Milestone, on: t.milestone_id == m.id,
          where: t.project_id == ^project.id and
            fragment("NOT (?->>'closed')::boolean", t.task_status) and
            (is_nil(t.milestone_id) or m.status != :done),
          select: count(t.id)
        )

        count = Repo.one(query)
        {:ok, count || 0}
      end)
    end

    def count_check_ins(multi) do
      Ecto.Multi.run(multi, :check_ins_count, fn _repo, %{project: project} ->
        count =
          from(c in Operately.Projects.CheckIn, where: c.project_id == ^project.id)
          |> Repo.aggregate(:count)

        {:ok, count}
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

    def update_task_statuses(multi, task_statuses) do
      case task_statuses do
        [] ->
          Ecto.Multi.run(multi, :validate_task_statuses, fn _repo, _changes ->
            {:error, "At least one task status is required"}
          end)

        _ ->
          Ecto.Multi.update(multi, :updated_project, fn %{project: project} ->
            Operately.Projects.Project.changeset(project, %{task_statuses: task_statuses})
          end)
      end
    end

    def validate_status_replacements(multi, _task_statuses, []), do: multi

    def validate_status_replacements(multi, task_statuses, replacements) do
      Ecto.Multi.run(multi, :validate_replacements, fn _repo, _changes ->
        new_status_ids = MapSet.new(task_statuses, & &1.id)
        deleted_status_ids = MapSet.new(replacements, & &1.deleted_status_id)

        invalid_replacements =
          Enum.filter(replacements, fn r ->
            replacement_is_deleted = MapSet.member?(deleted_status_ids, r.replacement_status_id)
            replacement_not_in_new_statuses = not MapSet.member?(new_status_ids, r.replacement_status_id)

            replacement_is_deleted or replacement_not_in_new_statuses
          end)

        if Enum.empty?(invalid_replacements) do
          {:ok, :valid}
        else
          {:error, "Replacement statuses must be existing statuses that are not being deleted"}
        end
      end)
    end

    def replace_deleted_task_statuses(multi, []), do: multi

    def replace_deleted_task_statuses(multi, replacements) do
      Ecto.Multi.run(multi, :replace_task_statuses, fn _repo, changes ->
        project = Map.get(changes, :updated_project, changes.project)
        replacement_map =
          Map.new(replacements, fn r -> {r.deleted_status_id, r.replacement_status_id} end)

        deleted_status_ids = Map.keys(replacement_map)

        tasks =
          from(t in Operately.Tasks.Task,
            where: t.project_id == ^project.id,
            where: fragment("?->>'id' = ANY(?)", t.task_status, ^deleted_status_ids)
          )
          |> Repo.all()

        new_statuses_by_id = Map.new(project.task_statuses, fn s -> {s.id, s} end)

        results =
          Enum.map(tasks, fn task ->
            old_status_id = task.task_status.id
            new_status_id = Map.get(replacement_map, old_status_id)
            new_status = Map.get(new_statuses_by_id, new_status_id)

            if new_status do
              task
              |> Operately.Tasks.Task.changeset(%{task_status: Map.from_struct(new_status)})
              |> Repo.update()
            else
              {:ok, task}
            end
          end)

        errors = Enum.filter(results, fn
          {:error, _} -> true
          _ -> false
        end)

        if Enum.empty?(errors) do
          {:ok, length(tasks)}
        else
          List.first(errors)
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

    def create_subscription(multi, nil), do: multi

    def create_subscription(multi, person_id) do
      multi
      |> Ecto.Multi.run(:subscription_list, fn _repo, changes ->
        SubscriptionList.get(:system, parent_id: changes.project.id)
      end)
      |> Ecto.Multi.run(:subscription, fn _repo, changes ->
          case Subscription.get(:system, subscription_list_id: changes.subscription_list.id, person_id: person_id) do
            {:error, :not_found} ->
              Operately.Notifications.create_subscription(%{
                subscription_list_id: changes.subscription_list.id,
                person_id: person_id,
                type: :invited,
              })

            {:ok, subscription} ->
              Operately.Notifications.update_subscription(subscription, %{canceled: false})
          end
      end)
    end

    def create_milestone(multi, inputs) do
      multi
      |> SubscriptionListOps.insert(%{ send_to_everyone: false, subscription_parent_type: :project_milestone })
      |> Ecto.Multi.run(:milestone, fn _repo, changes ->
        Operately.Projects.create_milestone(%{
          title: inputs.name,
          project_id: changes.project.id,
          creator_id: changes.me.id,
          timeframe: %{
            contextual_start_date: nil,
            contextual_end_date: inputs.due_date
          },
          subscription_list_id: changes.subscription_list.id,
        })
      end)
      |> SubscriptionListOps.update(:milestone)
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

    def add_milestone_to_ordering_state(multi) do
      Ecto.Multi.run(multi, :updated_project_ordering_state, fn _, changes ->
        project = Map.fetch!(changes, :project)
        milestone = Map.fetch!(changes, :milestone)

        updated_state =
          project.milestones_ordering_state
          |> OrderingState.load()
          |> OrderingState.add_milestone(milestone)

        Operately.Projects.update_project(project, %{milestones_ordering_state: updated_state})
      end)
    end

    def save_activity(multi, activity_type, callback) do
      Ecto.Multi.merge(multi, fn changes ->
        Operately.Activities.insert_sync(Ecto.Multi.new(), changes.me.id, activity_type, fn _ -> callback.(changes) end)
      end)
    end

    def get_contributors(multi, inputs) do
      Ecto.Multi.run(multi, :contributors, fn _repo, %{project: project} ->
        base_query = from(p in Operately.People.Person,
          join: c in Operately.Projects.Contributor, on: c.person_id == p.id and c.project_id == ^project.id
        )

        query = case inputs[:query] do
          nil -> base_query
          "" -> base_query
          search_str -> from(p in base_query,
            where: ilike(p.full_name, ^"%#{search_str}%") or ilike(p.title, ^"%#{search_str}%")
          )
        end

        query = case inputs[:ignored_ids] do
          nil -> query
          [] -> query
          ignored_ids -> from(p in query, where: p.id not in ^ignored_ids)
        end

        {:ok, Repo.all(query)}
      end)
    end

    def find_previous_goal(multi) do
      Ecto.Multi.run(multi, :previous_goal, fn _repo, %{project: project} ->
        goal = case project do
          %{goal: nil} -> nil
          %{goal: %Ecto.Association.NotLoaded{}} -> nil
          %{goal: goal} -> goal
        end

        {:ok, goal}
      end)
    end

    def commit(multi) do
      Operately.Repo.transaction(multi)
    end

    def broadcast_review_count_update(result) do
      case result do
        {:ok, changes} ->
          broadcast(changes[:task])
          broadcast(changes[:updated_task_with_preloads] || changes[:updated_task])
          broadcast(changes[:project])

        _ ->
          :ok
      end

      result
    end

    defp broadcast(project = %Operately.Projects.Project{}) do
      if Ecto.assoc_loaded?(project.champion) and not is_nil(project.champion) do
        broadcast(project.champion.id)
      end
    end

    defp broadcast(task = %Operately.Tasks.Task{}) do
      if Ecto.assoc_loaded?(task.assigned_people) do
        Enum.each(task.assigned_people, fn person ->
          broadcast(person.id)
        end)
      end
    end

    defp broadcast(person_id) when is_binary(person_id) do
      OperatelyWeb.Api.Subscriptions.AssignmentsCount.broadcast(person_id: person_id)
    end

    defp broadcast(_), do: :ok

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
        {:error, _failed_operation, {:bad_request, message}, _changes} ->
          {:error, :bad_request, message}

        {:error, _failed_operation, {:not_found, message}, _changes} ->
          {:error, :not_found, message}

        {:error, _failed_operation, :not_found, _changes} ->
          {:error, :not_found}

        {:error, _failed_operation, :forbidden, _changes} ->
          {:error, :forbidden}

        {:error, :validate_milestone, message, _changes} ->
          {:error, :bad_request, message}

        {:error, :validate_task_statuses, message, _changes} ->
          {:error, :bad_request, message}

        {:error, :validate_replacements, message, _changes} ->
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
