defmodule Operately.Operations.ProjectTemplateCreationFromProject do
  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.Comments.CommentThread
  alias Operately.People.Person
  alias Operately.Projects.{Contributor, Project}
  alias Operately.Repo
  alias __MODULE__.{CopyPlanner, ScheduleValidator, TemplateCreator, Validator}

  defstruct [:project_id, :creator_id, :name, :description, include_people_and_assignments: false, include_discussions: true]

  def run(%__MODULE__{} = params) do
    Multi.new()
    |> Multi.run(:copy_plan, fn repo, _changes -> build_copy_plan(repo, params) end)
    |> Multi.insert(:template, fn %{copy_plan: plan} -> TemplateCreator.template_changeset(plan) end)
    |> Multi.run(:template_children, fn repo, %{copy_plan: plan, template: template} ->
      TemplateCreator.insert_children(repo, plan, template)
    end)
    |> Repo.transaction()
    |> extract_result()
  end

  defp build_copy_plan(repo, params) do
    with {:ok, project} <- load_project(repo, params.project_id),
         {:ok, creator} <- load_creator(repo, params.creator_id),
         :ok <- Validator.validate(project, creator),
         :ok <- ScheduleValidator.validate(project) do
      CopyPlanner.build(project, creator, params, load_project_discussions(repo, project.id))
    end
  end

  defp load_project(repo, project_id) do
    case repo.get(Project, project_id, with_deleted: true) do
      nil ->
        {:error, :project_not_found}

      project ->
        project =
          repo.preload(project,
            contributors: from(c in Contributor, order_by: [asc: c.inserted_at, asc: c.id]),
            milestones: from(m in Operately.Projects.Milestone, order_by: [asc: m.inserted_at, asc: m.id]),
            tasks: from(t in Operately.Tasks.Task, order_by: [asc: t.inserted_at, asc: t.id], preload: [:assignees])
          )

        {:ok, %{project | contributors: Contributor.load_project_access_levels(project.contributors)}}
    end
  end

  defp load_project_discussions(repo, project_id) do
    from(discussion in CommentThread,
      where: discussion.parent_id == ^project_id and discussion.parent_type == :project,
      order_by: [desc: discussion.inserted_at, desc: discussion.id],
      preload: [:author]
    )
    |> repo.all()
  end

  defp load_creator(repo, creator_id) do
    case repo.get(Person, creator_id) do
      nil -> {:error, :creator_not_found}
      creator -> {:ok, creator}
    end
  end

  defp extract_result({:ok, %{template: template}}), do: {:ok, template}
  defp extract_result({:error, :copy_plan, reason, _changes}), do: {:error, reason}
  defp extract_result({:error, :template, changeset, _changes}), do: {:error, {:invalid_template, changeset}}
  defp extract_result({:error, :template_children, reason, _changes}), do: {:error, reason}

  defmodule CopyPlanner do
    alias Operately.Operations.ProjectTemplateCreationFromProject
    alias Operately.ProjectTemplates.{Copy, Milestone, Task}
    alias Operately.Operations.ProjectTemplateCreationFromProject.PeoplePlanner
    alias OperatelyWeb.Paths

    def build(project, creator, %ProjectTemplateCreationFromProject{} = params, discussions) do
      with {:ok, workflow} <- copy_workflow(project.task_statuses),
           {:ok, graph} <- plan_graph(project, workflow),
           {:ok, people_graph} <- PeoplePlanner.build(project, graph.tasks, params.include_people_and_assignments) do
        {:ok,
         graph
         |> Map.merge(people_graph)
         |> Map.put(:discussions, plan_discussions(discussions, params.include_discussions))
         |> Map.put(:template_attrs, %{
           company_id: project.company_id,
           space_id: project.group_id,
           creator_id: creator.id,
           source_project_id: project.id,
           name: params.name,
           description: params.description,
           duration_days: Copy.offset_from_date(start_date(project), end_date(project)),
           task_statuses: Enum.map(workflow.copied, &Copy.status_attrs/1),
           milestones_ordering_state: graph.milestones_ordering_state,
           tasks_kanban_state: graph.tasks_kanban_state
         })}
      end
    end

    defp plan_graph(project, workflow) do
      start_date = start_date(project)
      milestones = Enum.map(project.milestones, &plan_milestone(&1, start_date))
      milestone_ids = Map.new(milestones, &{&1.source.id, &1.target.id})
      tasks = Enum.map(project.tasks, &plan_task(&1, milestone_ids, workflow, start_date))

      with {:ok, milestone_ordering} <-
             Copy.map_ordering(project.milestones_ordering_state, milestones, &source_milestone_path/1, &target_milestone_path/1),
           {:ok, root_kanban} <- plan_kanban(project.tasks_kanban_state, root_tasks(tasks), workflow),
           {:ok, milestones} <- plan_milestone_states(milestones, tasks, workflow) do
        {:ok,
         %{
           milestones: milestones,
           tasks: tasks,
           milestones_ordering_state: milestone_ordering,
           tasks_kanban_state: root_kanban
         }}
      else
        {:error, reason} -> {:error, {:invalid_source, reason}}
      end
    end

    defp plan_milestone(source, start_date) do
      %{
        source: source,
        target: %Milestone{id: Ecto.UUID.generate()},
        due_offset_days: Copy.offset_from_date(start_date, milestone_due_date(source))
      }
    end

    defp plan_task(source, milestone_ids, workflow, start_date) do
      target_milestone_id = source.milestone_id && Map.fetch!(milestone_ids, source.milestone_id)
      due_date = task_due_date(source, start_date)

      %{
        source: source,
        target: %Task{id: Ecto.UUID.generate(), project_template_milestone_id: target_milestone_id},
        due_offset_days: Copy.offset_from_date(start_date, due_date),
        reminders: if(due_date, do: Copy.due_relative_reminders(source.reminders), else: []),
        task_status: Copy.status_attrs(workflow.first_open)
      }
    end

    defp plan_milestone_states(milestones, tasks, workflow) do
      Enum.reduce_while(milestones, {:ok, []}, fn milestone, {:ok, planned} ->
        container_tasks = milestone_tasks(tasks, milestone.source.id)

        with {:ok, ordering} <-
               Copy.map_ordering(milestone.source.tasks_ordering_state, container_tasks, &source_task_path/1, &target_task_path/1),
             {:ok, kanban} <- plan_kanban(milestone.source.tasks_kanban_state, container_tasks, workflow) do
          {:cont, {:ok, planned ++ [Map.merge(milestone, %{tasks_ordering_state: ordering, tasks_kanban_state: kanban})]}}
        else
          {:error, reason} -> {:halt, {:error, reason}}
        end
      end)
    end

    defp plan_kanban(state, tasks, workflow) do
      Copy.reset_kanban(state, tasks, workflow, &source_task_path/1, &target_task_path/1, & &1.source.task_status)
    end

    defp copy_workflow(statuses) do
      case Copy.copy_workflow(statuses) do
        {:ok, workflow} -> {:ok, workflow}
        {:error, reason} -> {:error, {:invalid_source, reason}}
      end
    end

    defp start_date(project), do: Operately.ContextualDates.Timeframe.start_date(project.timeframe)
    defp end_date(project), do: Operately.ContextualDates.Timeframe.end_date(project.timeframe)
    defp milestone_due_date(milestone), do: Operately.ContextualDates.Timeframe.end_date(milestone.timeframe)
    defp task_due_date(%{due_date: nil}, _start_date), do: nil

    defp task_due_date(task, start_date) do
      date = task.due_date.date
      if Date.compare(date, start_date) == :lt, do: nil, else: date
    end

    defp source_milestone_path(planned), do: Paths.milestone_id(planned.source)
    defp target_milestone_path(planned), do: Paths.project_template_milestone_id(planned.target)
    defp source_task_path(planned), do: Paths.task_id(planned.source)
    defp target_task_path(planned), do: Paths.project_template_task_id(planned.target)
    defp root_tasks(tasks), do: Enum.filter(tasks, &is_nil(&1.source.milestone_id))
    defp milestone_tasks(tasks, milestone_id), do: Enum.filter(tasks, &(&1.source.milestone_id == milestone_id))

    defp plan_discussions(_discussions, false), do: []

    defp plan_discussions(discussions, true) do
      discussions
      |> Enum.with_index()
      |> Enum.map(fn {source, position} ->
        %{source: source, target: %Operately.ProjectTemplates.Discussion{id: Ecto.UUID.generate()}, position: position}
      end)
    end
  end

  defmodule PeoplePlanner do
    alias Operately.Access.Binding
    alias Operately.ProjectTemplates.Person, as: TemplatePerson
    alias Operately.ProjectTemplates.TaskAssignment

    @role_priority %{champion: 3, reviewer: 2, contributor: 1}

    def build(_project, _tasks, false), do: {:ok, %{people: [], task_assignments: []}}

    def build(project, tasks, true) do
      people = planned_people(project)
      people_by_person_id = Map.new(people, &{&1.person_id, &1})
      task_ids = Map.new(tasks, &{&1.source.id, &1.target.id})

      assignments =
        for task <- project.tasks,
            assignee <- task.assignees do
          %{
            target: %TaskAssignment{id: Ecto.UUID.generate()},
            project_template_task_id: Map.fetch!(task_ids, task.id),
            project_template_person_id: Map.fetch!(people_by_person_id, assignee.person_id).target.id
          }
        end
        |> Enum.uniq_by(&{&1.project_template_task_id, &1.project_template_person_id})

      {:ok, %{people: people, task_assignments: assignments}}
    end

    defp planned_people(project) do
      contributor_entries =
        Enum.map(project.contributors, fn contributor ->
          %{
            person_id: contributor.person_id,
            role: contributor.role,
            responsibility: contributor.responsibility,
            access_level: contributor.access_level || Binding.no_access()
          }
        end)

      assignment_entries =
        project.tasks
        |> Enum.flat_map(& &1.assignees)
        |> Enum.map(fn assignee ->
          %{
            person_id: assignee.person_id,
            role: :contributor,
            responsibility: "Contributor",
            access_level: Binding.edit_access()
          }
        end)

      (contributor_entries ++ assignment_entries)
      |> Enum.group_by(& &1.person_id)
      |> Enum.map(fn {person_id, entries} ->
        role_entry = Enum.max_by(entries, &Map.fetch!(@role_priority, &1.role))

        %{
          target: %TemplatePerson{id: Ecto.UUID.generate()},
          person_id: person_id,
          role: role_entry.role,
          responsibility: role_entry.responsibility,
          access_level: entries |> Enum.map(& &1.access_level) |> Enum.max()
        }
      end)
      |> Enum.sort_by(&{role_order(&1.role), &1.person_id})
    end

    defp role_order(:champion), do: 0
    defp role_order(:reviewer), do: 1
    defp role_order(:contributor), do: 2
  end

  defmodule ScheduleValidator do
    alias Operately.ContextualDates.Timeframe

    def resource_types, do: [:project, :milestone, :task]
    def fields, do: [:start_date, :end_date, :due_date]
    def reasons, do: [:missing, :before_project_start]

    def validate(project) do
      case Timeframe.start_date(project.timeframe) do
        nil -> {:error, {:invalid_schedule, %{issues: [missing_start_issue(project)]}}}
        start_date -> validate_dates(project, start_date)
      end
    end

    defp validate_dates(project, start_date) do
      issues =
        [date_issue(project, :project, project.name, :end_date, Timeframe.end_date(project.timeframe), start_date)] ++
          Enum.map(project.milestones, &date_issue(&1, :milestone, &1.title, :due_date, Timeframe.end_date(&1.timeframe), start_date))

      issues = Enum.reject(issues, &is_nil/1)
      if issues == [], do: :ok, else: {:error, {:invalid_schedule, %{issues: issues}}}
    end

    defp date_issue(_resource, _type, _name, _field, nil, _start_date), do: nil

    defp date_issue(resource, type, name, field, date, start_date) do
      if Date.compare(date, start_date) == :lt do
        %{
          resource_type: type,
          resource_id: resource.id,
          resource_name: name,
          field: field,
          date: date,
          reason: :before_project_start
        }
      end
    end

    defp missing_start_issue(project) do
      %{
        resource_type: :project,
        resource_id: project.id,
        resource_name: project.name,
        field: :start_date,
        date: nil,
        reason: :missing
      }
    end
  end

  defmodule Validator do
    alias Operately.People.Person
    alias Operately.Projects.{Milestone, Project}
    alias Operately.Tasks.Task

    def validate(%Project{} = project, %Person{} = creator) do
      with :ok <- validate_active(project),
           :ok <- validate_creator_scope(project, creator),
           :ok <- validate_changeset(project, :project, &Project.changeset(&1, %{})),
           :ok <- validate_changesets(project.milestones, :milestone, &Milestone.changeset(&1, %{})),
           :ok <- validate_changesets(project.tasks, :task, &Task.changeset(&1, %{})),
           :ok <- validate_task_containers(project),
           :ok <- validate_task_status_references(project) do
        :ok
      end
    end

    defp validate_active(%Project{deleted_at: deleted_at}) when not is_nil(deleted_at), do: {:error, :project_not_active}
    defp validate_active(_project), do: :ok

    defp validate_creator_scope(project, creator) do
      if project.company_id == creator.company_id, do: :ok, else: {:error, :creator_scope_mismatch}
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
      if changeset.valid?, do: :ok, else: {:error, {:invalid_source_child, type, changeset}}
    end

    defp validate_task_containers(project) do
      milestone_ids = MapSet.new(project.milestones, & &1.id)

      if Enum.all?(project.tasks, &(is_nil(&1.milestone_id) or MapSet.member?(milestone_ids, &1.milestone_id))) do
        :ok
      else
        {:error, {:invalid_source, :foreign_milestone}}
      end
    end

    defp validate_task_status_references(project) do
      status_ids = MapSet.new(project.task_statuses, & &1.id)

      if Enum.all?(project.tasks, &(&1.task_status && MapSet.member?(status_ids, &1.task_status.id))) do
        :ok
      else
        {:error, {:invalid_source, :unknown_task_status}}
      end
    end
  end

  defmodule TemplateCreator do
    alias Operately.ProjectTemplates.{Discussion, Milestone, Person, ProjectTemplate, Task, TaskAssignment}

    def template_changeset(plan), do: ProjectTemplate.changeset(plan.template_attrs)

    def insert_children(repo, plan, template) do
      with {:ok, milestones} <- insert_milestones(repo, plan.milestones, template),
           {:ok, tasks} <- insert_tasks(repo, plan.tasks, template),
           {:ok, people} <- insert_people(repo, plan.people, template),
           {:ok, assignments} <- insert_assignments(repo, plan.task_assignments, template),
           {:ok, discussions} <- insert_discussions(repo, plan.discussions, template) do
        {:ok, %{milestones: milestones, tasks: tasks, people: people, task_assignments: assignments, discussions: discussions}}
      end
    end

    defp insert_milestones(repo, milestones, template) do
      insert_all(
        milestones,
        fn planned ->
          Milestone.changeset(planned.target, %{
            project_template_id: template.id,
            title: planned.source.title,
            description: planned.source.description,
            due_offset_days: planned.due_offset_days,
            tasks_ordering_state: planned.tasks_ordering_state,
            tasks_kanban_state: planned.tasks_kanban_state
          })
        end,
        repo,
        :milestone
      )
    end

    defp insert_tasks(repo, tasks, template) do
      insert_all(
        tasks,
        fn planned ->
          Task.changeset(planned.target, %{
            project_template_id: template.id,
            name: planned.source.name,
            description: planned.source.description,
            priority: planned.source.priority,
            size: planned.source.size,
            due_offset_days: planned.due_offset_days,
            reminders: Enum.map(planned.reminders, &reminder_attrs/1),
            task_status: planned.task_status
          })
        end,
        repo,
        :task
      )
    end

    defp insert_people(repo, people, template) do
      insert_all(
        people,
        fn planned ->
          Person.changeset(planned.target, %{
            project_template_id: template.id,
            person_id: planned.person_id,
            role: planned.role,
            responsibility: planned.responsibility,
            access_level: planned.access_level
          })
        end,
        repo,
        :person
      )
    end

    defp insert_assignments(repo, assignments, template) do
      insert_all(
        assignments,
        fn planned ->
          TaskAssignment.changeset(planned.target, %{
            project_template_id: template.id,
            project_template_task_id: planned.project_template_task_id,
            project_template_person_id: planned.project_template_person_id
          })
        end,
        repo,
        :task_assignment
      )
    end

    defp insert_discussions(repo, discussions, template) do
      insert_all(
        discussions,
        fn planned ->
          Discussion.changeset(planned.target, %{
            project_template_id: template.id,
            author_id: planned.source.author_id,
            title: planned.source.title,
            body: planned.source.message,
            position: planned.position
          })
        end,
        repo,
        :discussion
      )
    end

    defp insert_all(resources, changeset_fun, repo, type) do
      Enum.reduce_while(resources, {:ok, []}, fn resource, {:ok, inserted} ->
        case repo.insert(changeset_fun.(resource)) do
          {:ok, value} -> {:cont, {:ok, inserted ++ [value]}}
          {:error, changeset} -> {:halt, invalid_child(type, changeset)}
        end
      end)
    end

    defp reminder_attrs(reminder), do: %{type: reminder.type, days: reminder.days, date: reminder.date}
    defp invalid_child(type, changeset), do: {:error, {:invalid_template_child, type, changeset}}
  end
end
