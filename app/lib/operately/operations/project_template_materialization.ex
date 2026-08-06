defmodule Operately.Operations.ProjectTemplateMaterialization do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Operations.ProjectCreation
  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Repo
  alias __MODULE__.{ChildrenCreator, CopyPlanner, ProjectCreator, Validator}

  defstruct [:template_id, :start_date, :project]

  def run(%__MODULE__{start_date: %Date{}, project: %ProjectCreation{}} = params) do
    Multi.new()
    |> Multi.run(:copy_plan, fn repo, _changes -> build_copy_plan(repo, params) end)
    |> Multi.merge(fn %{copy_plan: plan} -> ProjectCreator.build(params.project, plan) end)
    |> Multi.run(:materialized_children, fn repo, %{copy_plan: plan, project: project} ->
      ChildrenCreator.insert(repo, plan, project)
    end)
    |> Repo.transaction()
    |> extract_result()
  end

  def run(%__MODULE__{}), do: {:error, :start_date_required}

  defp build_copy_plan(repo, params) do
    with {:ok, template} <- load_template(repo, params),
         :ok <- Validator.validate(template, params.project) do
      CopyPlanner.build(template, params.start_date)
    end
  end

  defp load_template(repo, params) do
    case repo.get(ProjectTemplate, params.template_id) do
      nil ->
        {:error, :template_not_found}

      template ->
        {:ok,
         repo.preload(template,
           milestones: from(m in Operately.ProjectTemplates.Milestone, order_by: [asc: m.inserted_at, asc: m.id]),
           tasks: from(t in Operately.ProjectTemplates.Task, order_by: [asc: t.inserted_at, asc: t.id])
         )}
    end
  end

  defp extract_result({:ok, %{project: project}}), do: {:ok, project}
  defp extract_result({:error, :copy_plan, reason, _changes}), do: {:error, reason}
  defp extract_result({:error, :materialized_children, reason, _changes}), do: {:error, reason}
  defp extract_result({:error, step, reason, _changes}), do: {:error, {:project_creation, step, reason}}

  defmodule CopyPlanner do
    alias Operately.ContextualDates.ContextualDate
    alias Operately.ProjectTemplates.ProjectTemplate
    alias Operately.Projects.Milestone, as: ProjectMilestone
    alias Operately.Tasks.Status
    alias Operately.Tasks.Task, as: ProjectTask
    alias OperatelyWeb.Paths

    def build(%ProjectTemplate{} = template, %Date{} = start_date) do
      statuses = copy_statuses(template.task_statuses)

      with {:ok, graph} <- plan_graph(template, statuses, start_date) do
        {:ok,
         Map.merge(graph, %{
           source_template_id: template.id,
           description: template.description,
           timeframe: timeframe(start_date, relative_date(start_date, template.duration_days)),
           task_statuses: Enum.map(statuses.copied, &status_attrs/1)
         })}
      end
    end

    defp copy_statuses(statuses) do
      first_open = first_open_status(statuses)
      copied_by_source_id = Map.new(statuses, &{&1.id, copy_status(&1)})

      %{
        source: statuses,
        copied: Enum.map(statuses, &Map.fetch!(copied_by_source_id, &1.id)),
        copied_by_source_id: copied_by_source_id,
        first_open: Map.fetch!(copied_by_source_id, first_open.id)
      }
    end

    defp first_open_status(statuses) do
      statuses
      |> Enum.with_index()
      |> Enum.sort_by(fn {status, position} -> {status.index, position} end)
      |> Enum.find_value(fn {status, _position} -> if status.closed, do: nil, else: status end)
    end

    defp copy_status(status) do
      %Status{
        id: Ecto.UUID.generate(),
        label: status.label,
        color: status.color,
        index: status.index,
        value: status.value,
        closed: status.closed
      }
    end

    defp plan_graph(template, statuses, start_date) do
      milestones = Enum.map(template.milestones, &plan_milestone(&1, start_date))
      milestone_ids = Map.new(milestones, &{&1.source.id, &1.target.id})
      tasks = Enum.map(template.tasks, &plan_task(&1, milestone_ids, start_date))
      task_ids = Map.new(tasks, &{&1.source.id, &1.target.id})

      with {:ok, milestone_ordering} <- map_ordering(template.milestones_ordering_state, milestones, &source_milestone_path/1, &target_milestone_path/1),
           {:ok, root_kanban} <- map_kanban(template.tasks_kanban_state, root_tasks(tasks), statuses),
           {:ok, milestones} <- plan_milestone_states(milestones, tasks, statuses) do
        {:ok,
         %{
           milestones: milestones,
           tasks: tasks,
           milestone_ids: milestone_ids,
           task_ids: task_ids,
           milestone_ordering: milestone_ordering,
           root_kanban: root_kanban
         }}
      end
    end

    defp plan_milestone(source, start_date) do
      target = %ProjectMilestone{id: Ecto.UUID.generate(), title: source.title}
      %{source: source, target: target, due_date: relative_date(start_date, source.due_offset_days)}
    end

    defp plan_task(source, milestone_ids, start_date) do
      target_milestone_id = source.project_template_milestone_id && Map.fetch!(milestone_ids, source.project_template_milestone_id)
      target = %ProjectTask{id: Ecto.UUID.generate(), name: source.name, milestone_id: target_milestone_id}
      %{source: source, target: target, due_date: relative_date(start_date, source.due_offset_days)}
    end

    defp plan_milestone_states(milestones, tasks, statuses) do
      Enum.reduce_while(milestones, {:ok, []}, fn milestone, {:ok, planned} ->
        container_tasks = milestone_tasks(tasks, milestone.source.id)

        with {:ok, ordering} <- map_ordering(milestone.source.tasks_ordering_state, container_tasks, &source_task_path/1, &target_task_path/1),
             {:ok, kanban} <- map_kanban(milestone.source.tasks_kanban_state, container_tasks, statuses) do
          {:cont, {:ok, planned ++ [Map.merge(milestone, %{tasks_ordering_state: ordering, tasks_kanban_state: kanban})]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp map_ordering(ordering, resources, source_path, target_path) do
      valid_paths = Enum.map(resources, source_path)
      ordered = ordering ++ (valid_paths -- ordering)
      targets = Map.new(resources, &{source_path.(&1), target_path.(&1)})

      {:ok, Enum.map(ordered, &Map.fetch!(targets, &1))}
    end

    defp map_kanban(state, tasks, statuses) do
      state = Map.new(state, fn {key, ids} -> {to_string(key), ids} end)
      {:ok, reset_kanban(state, tasks, statuses)}
    end

    defp reset_kanban(state, tasks, statuses) do
      source_keys = statuses.source |> Enum.sort_by(& &1.index) |> Enum.map(&status_key/1)
      destination_keys = Enum.map(statuses.copied, &status_key/1)
      source_paths = Enum.map(tasks, &source_task_path/1)
      ordered_source_paths = source_keys |> Enum.flat_map(&List.wrap(Map.get(state, &1, []))) |> then(&(&1 ++ (source_paths -- &1)))
      target_paths = Map.new(tasks, &{source_task_path(&1), target_task_path(&1)})
      ordered_target_paths = Enum.map(ordered_source_paths, &Map.fetch!(target_paths, &1))
      empty_state = Map.new(destination_keys, &{&1, []})

      Map.put(empty_state, status_key(statuses.first_open), ordered_target_paths)
    end

    defp relative_date(_start_date, nil), do: nil
    defp relative_date(start_date, offset), do: Date.add(start_date, offset)

    defp timeframe(start_date, end_date) do
      %{
        contextual_start_date: contextual_date(start_date),
        contextual_end_date: contextual_date(end_date)
      }
    end

    defp contextual_date(nil), do: nil
    defp contextual_date(date), do: ContextualDate.create_day_date(date)

    defp status_attrs(status) do
      %{
        id: status.id,
        label: status.label,
        color: status.color,
        index: status.index,
        value: status.value,
        closed: status.closed
      }
    end

    defp status_key(status), do: status.value || status.id
    defp source_milestone_path(planned), do: Paths.project_template_milestone_id(planned.source)
    defp target_milestone_path(planned), do: Paths.milestone_id(planned.target)
    defp source_task_path(planned), do: Paths.project_template_task_id(planned.source)
    defp target_task_path(planned), do: Paths.task_id(planned.target)
    defp root_tasks(tasks), do: Enum.filter(tasks, &is_nil(&1.source.project_template_milestone_id))
    defp milestone_tasks(tasks, milestone_id), do: Enum.filter(tasks, &(&1.source.project_template_milestone_id == milestone_id))
  end

  defmodule ProjectCreator do
    alias Ecto.Multi
    alias Operately.Access
    alias Operately.Access.{Binding, Context}
    alias Operately.Activities
    alias Operately.Companies
    alias Operately.Notifications
    alias Operately.Notifications.Subscription
    alias Operately.Operations.Notifications.Subscription, as: SubscriptionOps
    alias Operately.Operations.Notifications.SubscriptionList, as: SubscriptionListOps
    alias Operately.Operations.ProjectCreation
    alias Operately.Projects.{Contributor, Project}
    alias Operately.ResourceHubs.ResourceHub
    alias Operately.Search.IndexUpdates

    def build(%ProjectCreation{} = params, plan) do
      Multi.new()
      |> insert_project(params, plan)
      |> insert_default_resource_hub()
      |> insert_access_context()
      |> insert_champion_as_contributor(params)
      |> insert_reviewer_as_contributor(params)
      |> insert_creator_as_contributor(params)
      |> insert_mentioned_people(params, plan.description)
      |> insert_bindings(params)
      |> insert_activity(params)
      |> Companies.mark_setup_completed(params.company_id)
      |> IndexUpdates.enqueue(:search_project, "project", fn changes -> changes.project.id end)
    end

    defp insert_project(multi, params, plan) do
      multi
      |> SubscriptionListOps.insert(%{subscription_parent_type: :project})
      |> Multi.insert(:project, fn changes ->
        Project.changeset(%{
          company_id: params.company_id,
          group_id: params.group_id,
          goal_id: params.goal_id,
          source_template_id: plan.source_template_id,
          name: params.name,
          description: plan.description,
          private: is_private(params.visibility),
          creator_id: params.creator_id,
          started_at: DateTime.utc_now(),
          timeframe: plan.timeframe,
          next_check_in_scheduled_at: Operately.Time.first_friday_from_today(),
          health: :on_track,
          task_statuses: plan.task_statuses,
          milestones_ordering_state: plan.milestone_ordering,
          tasks_kanban_state: plan.root_kanban,
          subscription_list_id: changes.subscription_list.id
        })
      end)
      |> SubscriptionListOps.update(:project)
    end

    defp insert_default_resource_hub(multi) do
      Multi.insert(multi, :resource_hub, fn changes ->
        ResourceHub.changeset(%{
          project_id: changes.project.id,
          name: "Documents & Files"
        })
      end)
    end

    defp insert_access_context(multi) do
      Multi.insert(multi, :context, fn changes ->
        Context.changeset(%{project_id: changes.project.id})
      end)
    end

    defp insert_champion_as_contributor(multi, params) do
      if params.champion_id do
        multi
        |> Multi.insert(:champion, fn changes ->
          Contributor.changeset(%{
            project_id: changes.project.id,
            person_id: params.champion_id,
            responsibility: " ",
            role: :champion
          })
        end)
        |> Multi.run(:champion_subscription, fn _repo, %{project: project} ->
          ensure_subscription(project.subscription_list_id, params.champion_id)
        end)
      else
        multi
      end
    end

    defp insert_reviewer_as_contributor(multi, params) do
      if params.reviewer_id do
        multi
        |> Multi.insert(:reviewer, fn changes ->
          Contributor.changeset(%{
            project_id: changes.project.id,
            person_id: params.reviewer_id,
            responsibility: " ",
            role: :reviewer
          })
        end)
        |> Multi.run(:reviewer_subscription, fn _repo, %{project: project} ->
          ensure_subscription(project.subscription_list_id, params.reviewer_id)
        end)
      else
        multi
      end
    end

    defp insert_creator_as_contributor(multi, params) do
      if creator_is_champion_or_reviewer?(params) do
        multi
      else
        multi
        |> Multi.insert(:creator, fn changes ->
          Contributor.changeset(%{
            project_id: changes.project.id,
            person_id: params.creator_id,
            responsibility: params.creator_role,
            role: :contributor
          })
        end)
        |> Multi.run(:creator_subscription, fn _repo, %{project: project} ->
          ensure_subscription(project.subscription_list_id, params.creator_id)
        end)
      end
    end

    defp insert_mentioned_people(multi, params, description) do
      SubscriptionOps.insert(multi, %{id: params.creator_id}, %{
        content: description,
        subscriber_ids: []
      })
    end

    defp insert_bindings(multi, params) do
      full_access = Access.get_group!(company_id: params.company_id, tag: :full_access)
      standard = Access.get_group!(company_id: params.company_id, tag: :standard)
      space_full_access = Access.get_group!(group_id: params.group_id, tag: :full_access)
      space_standard = Access.get_group!(group_id: params.group_id, tag: :standard)

      multi
      |> Access.maybe_insert_anonymous_binding(params.company_id, params.anonymous_access_level)
      |> Access.insert_binding(:company_full_access_binding, full_access, Binding.full_access())
      |> Access.insert_binding(:company_members_binding, standard, params.company_access_level)
      |> Access.insert_binding(:space_full_access_binding, space_full_access, Binding.full_access())
      |> Access.insert_binding(:space_members_binding, space_standard, params.space_access_level)
      |> insert_binding_for_champion(params)
      |> insert_binding_for_reviewer(params)
      |> insert_binding_for_creator(params)
    end

    defp insert_binding_for_creator(multi, params) do
      if creator_is_champion_or_reviewer?(params) do
        multi
      else
        group = Access.get_group!(person_id: params.creator_id)
        Access.insert_binding(multi, :creator_binding, group, Binding.full_access())
      end
    end

    defp insert_binding_for_champion(multi, params) do
      if params.champion_id do
        group = Access.get_group!(person_id: params.champion_id)
        Access.insert_binding(multi, :champion_binding, group, Binding.full_access(), :champion)
      else
        multi
      end
    end

    defp insert_binding_for_reviewer(multi, params) do
      if params.reviewer_id do
        group = Access.get_group!(person_id: params.reviewer_id)
        Access.insert_binding(multi, :reviewer_binding, group, Binding.full_access(), :reviewer)
      else
        multi
      end
    end

    defp insert_activity(multi, params) do
      Activities.insert_sync(multi, params.creator_id, :project_created, fn changes ->
        %{
          company_id: changes.project.company_id,
          space_id: changes.project.group_id,
          project_id: changes.project.id,
          description: changes.project.description
        }
      end)
    end

    defp creator_is_champion_or_reviewer?(params) do
      params.champion_id == params.creator_id or params.reviewer_id == params.creator_id
    end

    defp is_private(visibility), do: visibility != "everyone"

    defp ensure_subscription(nil, _person_id), do: {:ok, nil}

    defp ensure_subscription(subscription_list_id, person_id) do
      case Subscription.get(:system, subscription_list_id: subscription_list_id, person_id: person_id) do
        {:error, :not_found} ->
          Notifications.create_subscription(%{
            subscription_list_id: subscription_list_id,
            person_id: person_id,
            type: :invited
          })

        {:ok, subscription} ->
          Notifications.update_subscription(subscription, %{canceled: false})
      end
    end
  end

  defmodule ChildrenCreator do
    alias Operately.ContextualDates.ContextualDate
    alias Operately.Notifications
    alias Operately.Notifications.SubscriptionList
    alias Operately.Projects.Milestone, as: ProjectMilestone
    alias Operately.Tasks.Status
    alias Operately.Tasks.Task, as: ProjectTask

    def insert(repo, plan, project) do
      with {:ok, milestones} <- insert_milestones(repo, plan.milestones, project),
           {:ok, tasks} <- insert_tasks(repo, plan.tasks, project, plan.task_statuses) do
        {:ok, %{milestones: milestones, tasks: tasks}}
      end
    end

    defp insert_milestones(repo, milestones, project) do
      Enum.reduce_while(milestones, {:ok, []}, fn planned, {:ok, inserted} ->
        with {:ok, subscription_list} <- insert_subscription_list(repo, planned.target.id, :project_milestone),
             changeset <-
               ProjectMilestone.changeset(planned.target, %{
                 project_id: project.id,
                 creator_id: project.creator_id,
                 title: planned.source.title,
                 description: planned.source.description,
                 status: :pending,
                 completed_at: nil,
                 timeframe: timeframe(nil, planned.due_date),
                 tasks_ordering_state: planned.tasks_ordering_state,
                 tasks_kanban_state: planned.tasks_kanban_state,
                 subscription_list_id: subscription_list.id
               }),
             {:ok, milestone} <- insert_child(repo, changeset, :milestone),
             :ok <- subscribe_milestone_people(repo, subscription_list.id, project) do
          {:cont, {:ok, inserted ++ [milestone]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp insert_tasks(repo, tasks, project, statuses) do
      Enum.reduce_while(tasks, {:ok, []}, fn planned, {:ok, inserted} ->
        status = first_open_status!(statuses)

        with {:ok, subscription_list} <- insert_subscription_list(repo, planned.target.id, :project_task),
             changeset <-
               ProjectTask.changeset(planned.target, %{
                 project_id: project.id,
                 milestone_id: planned.target.milestone_id,
                 creator_id: project.creator_id,
                 name: planned.source.name,
                 description: planned.source.description,
                 priority: planned.source.priority,
                 size: planned.source.size,
                 due_date: contextual_date(planned.due_date),
                 reminders: Enum.map(planned.source.reminders, &reminder_attrs/1),
                 task_status: status,
                 status: status.value || "todo",
                 closed_at: nil,
                 reopened_at: nil,
                 subscription_list_id: subscription_list.id
               }),
             {:ok, task} <- insert_child(repo, changeset, :task),
             :ok <- subscribe_task_creator(subscription_list.id, project.creator_id) do
          {:cont, {:ok, inserted ++ [task]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp insert_subscription_list(repo, parent_id, parent_type) do
      changeset = SubscriptionList.changeset(%{parent_id: parent_id, parent_type: parent_type, send_to_everyone: false})

      case repo.insert(changeset) do
        {:ok, subscription_list} -> {:ok, subscription_list}
        {:error, changeset} -> invalid_child(:subscription_list, changeset)
      end
    end

    defp insert_child(repo, changeset, type) do
      case repo.insert(changeset) do
        {:ok, resource} -> {:ok, resource}
        {:error, changeset} -> invalid_child(type, changeset)
      end
    end

    defp subscribe_milestone_people(repo, subscription_list_id, project) do
      project
      |> repo.preload(:champion)
      |> then(fn project -> [project.creator_id, project.champion && project.champion.id] end)
      |> Enum.reject(&is_nil/1)
      |> Enum.uniq()
      |> Enum.reduce_while(:ok, fn person_id, :ok ->
        case Notifications.create_subscription(%{subscription_list_id: subscription_list_id, person_id: person_id, type: :invited}) do
          {:ok, _subscription} -> {:cont, :ok}
          {:error, reason} -> {:halt, {:error, {:subscription_failed, reason}}}
        end
      end)
    end

    defp subscribe_task_creator(subscription_list_id, creator_id) do
      case Notifications.create_subscription(%{subscription_list_id: subscription_list_id, person_id: creator_id, type: :joined}) do
        {:ok, _subscription} -> :ok
        {:error, reason} -> {:error, {:subscription_failed, reason}}
      end
    end

    defp first_open_status!(statuses) do
      statuses
      |> Enum.map(&struct!(Status, &1))
      |> first_open_status()
      |> status_attrs()
    end

    defp first_open_status(statuses) do
      statuses
      |> Enum.with_index()
      |> Enum.sort_by(fn {status, position} -> {status.index, position} end)
      |> Enum.find_value(fn {status, _position} -> if status.closed, do: nil, else: status end)
    end

    defp timeframe(start_date, end_date) do
      %{
        contextual_start_date: contextual_date(start_date),
        contextual_end_date: contextual_date(end_date)
      }
    end

    defp contextual_date(nil), do: nil
    defp contextual_date(date), do: ContextualDate.create_day_date(date)

    defp reminder_attrs(reminder) do
      %{type: reminder.type, days: reminder.days, date: reminder.date}
    end

    defp status_attrs(status) do
      %{
        id: status.id,
        label: status.label,
        color: status.color,
        index: status.index,
        value: status.value,
        closed: status.closed
      }
    end

    defp invalid_child(type, changeset), do: {:error, {:invalid_child, type, changeset}}
  end

  defmodule Validator do
    alias Operately.Operations.ProjectCreation
    alias Operately.ProjectTemplates.{Milestone, ProjectTemplate, Task}
    alias Operately.Tasks.Status
    alias OperatelyWeb.Paths

    def validate(%ProjectTemplate{} = template, %ProjectCreation{} = project) do
      with :ok <- validate_active(template),
           :ok <- validate_scope(template, project),
           :ok <- validate_changeset(template, :template, &ProjectTemplate.changeset(&1, %{})),
           :ok <- validate_changesets(template.milestones, :milestone, &Milestone.changeset(&1, %{})),
           :ok <- validate_changesets(template.tasks, :task, &Task.changeset(&1, %{})),
           :ok <- validate_task_containers(template),
           :ok <- validate_task_status_references(template),
           :ok <- validate_workflow(template.task_statuses),
           :ok <- validate_graph_states(template) do
        :ok
      end
    end

    defp validate_active(%ProjectTemplate{archived_at: archived_at, deleted_at: deleted_at})
         when not is_nil(archived_at) or not is_nil(deleted_at),
         do: {:error, :template_not_active}

    defp validate_active(_template), do: :ok

    defp validate_scope(template, project) do
      if template.company_id == project.company_id and template.space_id == project.group_id do
        :ok
      else
        {:error, :template_scope_mismatch}
      end
    end

    defp validate_changesets(resources, type, changeset_fun) do
      Enum.reduce_while(resources, :ok, fn resource, :ok ->
        case validate_changeset(resource, type, changeset_fun) do
          :ok -> {:cont, :ok}
          error -> {:halt, error}
        end
      end)
    end

    defp validate_changeset(resource, type, changeset_fun) do
      changeset = changeset_fun.(resource)
      if changeset.valid?, do: :ok, else: invalid_child(type, changeset)
    end

    defp validate_task_containers(template) do
      milestone_ids = MapSet.new(template.milestones, & &1.id)

      if Enum.all?(template.tasks, &valid_task_container?(&1, milestone_ids)) do
        :ok
      else
        {:error, {:invalid_template, :foreign_milestone}}
      end
    end

    defp valid_task_container?(%Task{project_template_milestone_id: nil}, _milestone_ids), do: true
    defp valid_task_container?(task, milestone_ids), do: MapSet.member?(milestone_ids, task.project_template_milestone_id)

    defp validate_task_status_references(template) do
      status_ids = MapSet.new(template.task_statuses, & &1.id)

      if Enum.all?(template.tasks, &(&1.task_status && MapSet.member?(status_ids, &1.task_status.id))) do
        :ok
      else
        {:error, {:invalid_template, :unknown_task_status}}
      end
    end

    defp validate_workflow([]), do: {:error, {:invalid_template, :empty_workflow}}

    defp validate_workflow(statuses) when is_list(statuses) do
      changesets = Enum.map(statuses, &Status.changeset(&1, %{}))
      ids = Enum.map(statuses, & &1.id)
      keys = Enum.map(statuses, &status_key/1)

      cond do
        Enum.any?(changesets, &(not &1.valid?)) -> {:error, {:invalid_template, :invalid_task_status}}
        Enum.uniq(ids) != ids -> {:error, {:invalid_template, :duplicate_task_status}}
        Enum.any?(keys, &is_nil/1) or Enum.uniq(keys) != keys -> {:error, {:invalid_template, :duplicate_task_status_key}}
        Enum.all?(statuses, & &1.closed) -> {:error, {:invalid_template, :no_open_task_status}}
        true -> :ok
      end
    end

    defp validate_workflow(_statuses), do: {:error, {:invalid_template, :empty_workflow}}

    defp validate_graph_states(template) do
      milestone_paths = Enum.map(template.milestones, &Paths.project_template_milestone_id/1)
      root_tasks = Enum.filter(template.tasks, &is_nil(&1.project_template_milestone_id))

      with :ok <- validate_ordering(template.milestones_ordering_state, milestone_paths),
           :ok <- validate_kanban(template.tasks_kanban_state, root_tasks, template.task_statuses) do
        validate_milestone_states(template.milestones, template.tasks, template.task_statuses)
      end
    end

    defp validate_milestone_states(milestones, tasks, statuses) do
      Enum.reduce_while(milestones, :ok, fn milestone, :ok ->
        milestone_tasks = Enum.filter(tasks, &(&1.project_template_milestone_id == milestone.id))
        task_paths = Enum.map(milestone_tasks, &Paths.project_template_task_id/1)

        with :ok <- validate_ordering(milestone.tasks_ordering_state, task_paths),
             :ok <- validate_kanban(milestone.tasks_kanban_state, milestone_tasks, statuses) do
          {:cont, :ok}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp validate_ordering(ordering, valid_paths) when is_list(ordering) do
      cond do
        Enum.uniq(ordering) != ordering -> {:error, {:invalid_template, :duplicate_ordering_id}}
        not Enum.all?(ordering, &(&1 in valid_paths)) -> {:error, {:invalid_template, :foreign_ordering_id}}
        true -> :ok
      end
    end

    defp validate_ordering(_ordering, _valid_paths), do: {:error, {:invalid_template, :malformed_ordering_state}}

    defp validate_kanban(state, tasks, statuses) when is_map(state) do
      state = Map.new(state, fn {key, ids} -> {to_string(key), ids} end)
      status_keys = Enum.map(statuses, &status_key/1)
      task_paths = Enum.map(tasks, &Paths.project_template_task_id/1)
      provided_paths = status_keys |> Enum.flat_map(&List.wrap(Map.get(state, &1, [])))
      task_statuses = Map.new(tasks, &{Paths.project_template_task_id(&1), status_key(&1.task_status)})

      cond do
        not Enum.all?(Map.keys(state), &(&1 in status_keys)) -> {:error, {:invalid_template, :unknown_kanban_status}}
        not Enum.all?(Map.values(state), &is_list/1) -> {:error, {:invalid_template, :malformed_kanban_state}}
        Enum.uniq(provided_paths) != provided_paths -> {:error, {:invalid_template, :duplicate_kanban_task}}
        not Enum.all?(provided_paths, &(&1 in task_paths)) -> {:error, {:invalid_template, :foreign_kanban_task}}
        Enum.any?(state, fn {key, paths} -> Enum.any?(paths, &(task_statuses[&1] != key)) end) -> {:error, {:invalid_template, :mismatched_kanban_status}}
        true -> :ok
      end
    end

    defp validate_kanban(_state, _tasks, _statuses), do: {:error, {:invalid_template, :malformed_kanban_state}}

    defp status_key(status), do: status.value || status.id
    defp invalid_child(type, changeset), do: {:error, {:invalid_child, type, changeset}}
  end
end
