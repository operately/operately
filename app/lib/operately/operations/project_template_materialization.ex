defmodule Operately.Operations.ProjectTemplateMaterialization do
  @moduledoc """
  Materializes an active project template into an independent runtime project.

  The operation validates and copies the template's core graph, people, and assignments in one transaction.
  Authorization and feature-gate checks belong to the API boundary.
  """

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Operations.ProjectCreation
  alias Operately.ProjectTemplates.ProjectTemplate
  alias Operately.Repo
  alias __MODULE__.{ChildrenCreator, CopyPlanner, PeopleCreator, ProjectCreator, Validator}

  defstruct [:template_id, :start_date, :project]

  def run(%__MODULE__{start_date: %Date{}, project: %ProjectCreation{}} = params) do
    Multi.new()
    |> Multi.run(:copy_plan, fn repo, _changes -> build_copy_plan(repo, params) end)
    |> Multi.merge(fn %{copy_plan: plan} -> ProjectCreator.build(params.project, plan) end)
    |> Multi.run(:materialized_children, fn repo, %{copy_plan: plan, project: project, resource_hub: resource_hub} ->
      ChildrenCreator.insert(repo, plan, project, resource_hub)
    end)
    |> Multi.run(:materialized_people, fn repo, %{copy_plan: plan, project: project} ->
      PeopleCreator.insert(repo, plan, project)
    end)
    |> Repo.transaction()
    |> extract_result()
  end

  def run(%__MODULE__{}), do: {:error, :start_date_required}

  defp build_copy_plan(repo, params) do
    with {:ok, template} <- load_template(repo, params),
         :ok <- Validator.validate(template, params.project) do
      CopyPlanner.build(template, params.start_date, params.project.creator_id)
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
           people: from(p in Operately.ProjectTemplates.Person, order_by: [asc: p.inserted_at, asc: p.id], preload: [:person]),
           task_assignments: from(a in Operately.ProjectTemplates.TaskAssignment, order_by: [asc: a.inserted_at, asc: a.id]),
           discussions: from(d in Operately.ProjectTemplates.Discussion, order_by: [asc: d.position, asc: d.id], preload: [:author]),
           comments: from(c in Operately.ProjectTemplates.Comment, order_by: [asc: c.position, asc: c.id], preload: [:author]),
           tasks: from(t in Operately.ProjectTemplates.Task, order_by: [asc: t.inserted_at, asc: t.id]),
           resource_nodes: resource_nodes_query()
         )}
    end
  end

  defp resource_nodes_query do
    from(node in Operately.ProjectTemplates.ResourceNode,
      order_by: [asc: node.parent_folder_id, asc: node.position],
      preload: [folder: [], document: [:author], file: [:author, :blob, :preview_blob], link: [:author]]
    )
  end

  defp extract_result({:ok, %{project: project}}), do: {:ok, project}
  defp extract_result({:error, :copy_plan, reason, _changes}), do: {:error, reason}
  defp extract_result({:error, :materialized_children, reason, _changes}), do: {:error, reason}
  defp extract_result({:error, step, reason, _changes}), do: {:error, {:project_creation, step, reason}}

  defmodule CopyPlanner do
    alias Operately.ContextualDates.ContextualDate
    alias Operately.ProjectTemplates.Graph.{Copy, Kanban}
    alias Operately.ProjectTemplates.ProjectTemplate
    alias Operately.Operations.ProjectTemplateMaterialization.PeoplePlanner
    alias Operately.Projects.Milestone, as: ProjectMilestone
    alias Operately.Tasks.Task, as: ProjectTask
    alias OperatelyWeb.Paths

    def build(%ProjectTemplate{} = template, %Date{} = start_date, creator_id) do
      with {:ok, statuses} <- Copy.copy_workflow(template.task_statuses),
           {:ok, graph} <- plan_graph(template, statuses, start_date),
           {:ok, people_graph} <- PeoplePlanner.build(template, graph.tasks) do
        {:ok,
         graph
         |> Map.merge(people_graph)
         |> Map.merge(%{
           source_template_id: template.id,
           discussions: plan_discussions(template, creator_id),
           comments: template.comments || [],
           resource_nodes: template.resource_nodes,
           description: template.description,
           timeframe: timeframe(start_date, Copy.date_from_offset(start_date, template.duration_days)),
           task_statuses: Enum.map(statuses.copied, &Copy.status_attrs/1)
         })}
      else
        {:error, reason} -> {:error, {:invalid_template, reason}}
      end
    end

    defp plan_graph(template, statuses, start_date) do
      milestones = Enum.map(template.milestones, &plan_milestone(&1, start_date))
      milestone_ids = Map.new(milestones, &{&1.source.id, &1.target.id})
      tasks = Enum.map(template.tasks, &plan_task(&1, milestone_ids, start_date))
      task_ids = Map.new(tasks, &{&1.source.id, &1.target.id})

      with {:ok, milestone_ordering} <- Copy.map_ordering(template.milestones_ordering_state, milestones, &source_milestone_path/1, &target_milestone_path/1),
           {:ok, root_kanban} <- map_kanban(template.tasks_kanban_state, tasks, statuses),
           {:ok, milestones} <- plan_milestone_states(milestones, tasks, template.tasks_kanban_state, statuses) do
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
      %{source: source, target: target, due_date: Copy.date_from_offset(start_date, source.due_offset_days)}
    end

    defp plan_task(source, milestone_ids, start_date) do
      target_milestone_id = source.project_template_milestone_id && Map.fetch!(milestone_ids, source.project_template_milestone_id)
      target = %ProjectTask{id: Ecto.UUID.generate(), name: source.name, milestone_id: target_milestone_id}
      %{source: source, target: target, due_date: Copy.date_from_offset(start_date, source.due_offset_days)}
    end

    defp plan_milestone_states(milestones, tasks, board_kanban, statuses) do
      Enum.reduce_while(milestones, {:ok, []}, fn milestone, {:ok, planned} ->
        container_tasks = milestone_tasks(tasks, milestone.source.id)

        with {:ok, ordering} <- Copy.map_ordering(milestone.source.tasks_ordering_state, container_tasks, &source_task_path/1, &target_task_path/1),
             {:ok, kanban} <- map_kanban(board_kanban, container_tasks, statuses) do
          {:cont, {:ok, planned ++ [Map.merge(milestone, %{tasks_ordering_state: ordering, tasks_kanban_state: kanban})]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp map_kanban(state, tasks, statuses) do
      Kanban.remap(state, tasks, statuses, &source_task_path/1, &target_task_path/1, & &1.source.task_status)
    end

    defp timeframe(start_date, end_date) do
      %{
        contextual_start_date: contextual_date(start_date),
        contextual_end_date: contextual_date(end_date)
      }
    end

    defp contextual_date(nil), do: nil
    defp contextual_date(date), do: ContextualDate.create_day_date(date)

    defp source_milestone_path(planned), do: Paths.project_template_milestone_id(planned.source)
    defp target_milestone_path(planned), do: Paths.milestone_id(planned.target)
    defp source_task_path(planned), do: Paths.project_template_task_id(planned.source)
    defp target_task_path(planned), do: Paths.task_id(planned.target)
    defp milestone_tasks(tasks, milestone_id), do: Enum.filter(tasks, &(&1.source.project_template_milestone_id == milestone_id))

    defp plan_discussions(template, creator_id) do
      Enum.map(template.discussions, fn source ->
        author_id = if Operately.ProjectTemplates.Discussion.author_active?(source.author, template.company_id), do: source.author_id, else: creator_id
        %{source: source, author_id: author_id}
      end)
    end
  end

  defmodule PeoplePlanner do
    alias Operately.Access.Binding

    def build(template, tasks) do
      task_ids = Map.new(tasks, &{&1.source.id, &1.target.id})
      active_people = Enum.filter(template.people, &active?(&1.person, template.company_id))
      active_people_by_id = Map.new(active_people, &{&1.id, &1})

      people =
        Enum.map(active_people, fn template_person ->
          %{
            source: template_person,
            person: template_person.person,
            access_level: required_access(template_person)
          }
        end)

      assignments =
        template.task_assignments
        |> Enum.filter(&Map.has_key?(active_people_by_id, &1.project_template_person_id))
        |> Enum.map(fn assignment ->
          %{
            source: assignment,
            person: Map.fetch!(active_people_by_id, assignment.project_template_person_id).person,
            task_id: Map.fetch!(task_ids, assignment.project_template_task_id)
          }
        end)

      {:ok, %{people: people, task_assignments: assignments}}
    end

    defp active?(nil, _company_id), do: false

    defp active?(person, company_id) do
      person.company_id == company_id and person.suspended != true and is_nil(person.suspended_at)
    end

    defp required_access(%{role: role}) when role in [:champion, :reviewer], do: Binding.full_access()
    defp required_access(person), do: person.access_level
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
      params = %{params | champion_id: nil, reviewer_id: nil}

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

  defmodule PeopleCreator do
    alias Operately.Access.Binding
    alias Operately.Projects.ProjectParticipation

    def insert(repo, plan, project) do
      with {:ok, contributors} <- insert_contributors(repo, plan.people, project),
           :ok <- insert_assignments(repo, plan.task_assignments, project),
           :ok <- subscribe_champion_to_milestones(repo, plan.people, project) do
        {:ok, %{contributors: contributors, assignments: plan.task_assignments}}
      end
    end

    defp insert_contributors(repo, people, project) do
      Enum.reduce_while(people, {:ok, []}, fn planned, {:ok, inserted} ->
        with {:ok, contributor} <- upsert_contributor(repo, planned, project),
             :ok <- upsert_binding(repo, planned, project),
             :ok <- ensure_subscription(repo, project.subscription_list_id, planned.person.id, :invited) do
          {:cont, {:ok, inserted ++ [contributor]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp upsert_contributor(repo, planned, project) do
      ProjectParticipation.upsert_contributor(repo, project, planned.person.id, %{
        role: planned.source.role,
        responsibility: planned.source.responsibility
      })
    end

    defp upsert_binding(repo, planned, project) do
      ProjectParticipation.ensure_access(repo, project, planned.person.id, planned.access_level, tag: role_tag(planned.source.role))
    end

    defp insert_assignments(repo, assignments, project) do
      Enum.reduce_while(assignments, :ok, fn planned, :ok ->
        task = repo.get!(Operately.Tasks.Task, planned.task_id)

        with {:ok, _assignee} <- ProjectParticipation.insert_assignment(repo, task, planned.person.id),
             :ok <- ensure_subscription(repo, task.subscription_list_id, planned.person.id, :invited),
             :ok <- ensure_assignment_access(repo, planned.person.id, project) do
          {:cont, :ok}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp ensure_assignment_access(repo, person_id, project) do
      ProjectParticipation.ensure_assignee_contributor(repo, project, person_id)
      |> case do
        {:ok, _contributor} -> :ok
        error -> error
      end
    end

    defp subscribe_champion_to_milestones(repo, people, project) do
      case Enum.find(people, &(&1.source.role == :champion)) do
        nil ->
          :ok

        champion ->
          project.id
          |> milestone_subscription_list_ids(repo)
          |> Enum.reduce_while(:ok, fn list_id, :ok ->
            case ensure_subscription(repo, list_id, champion.person.id, :invited) do
              :ok -> {:cont, :ok}
              error -> {:halt, error}
            end
          end)
      end
    end

    defp milestone_subscription_list_ids(project_id, repo) do
      import Ecto.Query, only: [from: 2]

      repo.all(from(m in Operately.Projects.Milestone, where: m.project_id == ^project_id, select: m.subscription_list_id))
    end

    defp ensure_subscription(repo, subscription_list_id, person_id, type) do
      ProjectParticipation.ensure_subscription(repo, subscription_list_id, person_id, type)
    end

    defp role_tag(:champion), do: :champion
    defp role_tag(:reviewer), do: :reviewer
    defp role_tag(:contributor), do: nil
  end

  defmodule ChildrenCreator do
    alias Operately.ContextualDates.ContextualDate
    alias Operately.Notifications
    alias Operately.Notifications.SubscriptionList
    alias Operately.ProjectTemplates.Graph.Copy
    alias Operately.Projects.Milestone, as: ProjectMilestone
    alias Operately.Tasks.Status
    alias Operately.Tasks.Task, as: ProjectTask

    def insert(repo, plan, project, resource_hub) do
      with {:ok, milestones} <- insert_milestones(repo, plan.milestones, project),
           {:ok, tasks} <- insert_tasks(repo, plan.tasks, project, plan.task_statuses),
           {:ok, discussions} <- insert_discussions(repo, plan.discussions, project),
           {:ok, resources} <-
             Operately.ProjectTemplates.Resources.materialize(
               repo,
               %{project_template_id: plan.source_template_id, company_id: project.company_id, resource_nodes: plan.resource_nodes || []},
               %{project | resource_hub: resource_hub},
               project.creator_id
             ),
           {:ok, comments} <- insert_comments(repo, plan, project, discussions, resources) do
        {:ok, %{milestones: milestones, tasks: tasks, discussions: discussions, resources: resources.nodes, comments: comments}}
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
      status_structs = Enum.map(statuses, &struct!(Status, &1))
      fallback = first_open_status!(statuses)

      Enum.reduce_while(tasks, {:ok, []}, fn planned, {:ok, inserted} ->
        status =
          case Enum.find(status_structs, &(Copy.status_key(&1) == Copy.status_key(planned.source.task_status))) do
            nil -> fallback
            matched -> status_attrs(matched)
          end

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

    defp insert_discussions(repo, discussions, project) do
      inserted_at = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

      discussions
      |> Enum.reverse()
      |> Enum.with_index()
      |> Enum.reduce_while({:ok, []}, fn {planned, position}, {:ok, inserted} ->
        discussion = %Operately.Comments.CommentThread{
          id: Ecto.UUID.generate(),
          inserted_at: NaiveDateTime.add(inserted_at, position, :second),
          updated_at: NaiveDateTime.add(inserted_at, position, :second)
        }

        with {:ok, subscription_list} <- insert_subscription_list(repo, discussion.id, :comment_thread),
             changeset <-
               Operately.Comments.CommentThread.changeset(discussion, %{
                 author_id: planned.author_id,
                 parent_id: project.id,
                 parent_type: :project,
                 title: planned.source.title,
                 has_title: true,
                 message: planned.source.body,
                 subscription_list_id: subscription_list.id
               }),
             {:ok, inserted_discussion} <- insert_child(repo, changeset, :discussion) do
          {:cont, {:ok, inserted ++ [inserted_discussion]}}
        else
          error -> {:halt, error}
        end
      end)
    end

    defp insert_comments(repo, plan, project, discussions, resources) do
      Operately.ProjectTemplates.Comment.materialize(
        repo,
        plan.comments,
        %{
          discussion: Map.new(Enum.zip(Enum.reverse(plan.discussions), discussions), fn {planned, discussion} -> {planned.source.id, discussion.id} end),
          document: resources.parent_ids.document,
          file: resources.parent_ids.file,
          link: resources.parent_ids.link
        },
        project.company_id,
        project.creator_id
      )
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
    alias Operately.ProjectTemplates.Graph
    alias Operately.ProjectTemplates.ProjectTemplate

    def validate(%ProjectTemplate{} = template, %ProjectCreation{} = project) do
      with :ok <- Graph.Validator.validate(template),
           :ok <- validate_scope(template, project) do
        :ok
      end
    end

    defp validate_scope(template, project) do
      if template.company_id == project.company_id and template.space_id == project.group_id do
        :ok
      else
        {:error, :template_scope_mismatch}
      end
    end
  end
end
