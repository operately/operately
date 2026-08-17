defmodule Operately.Operations.ProjectTemplateDuplication do
  @moduledoc """
  Creates a copy of an active project template, including its workflow, tasks,
  milestones, people, discussions, comments, and Docs & Files.

  The copy has its own records, so editing it does not change the original
  template. The API is responsible for checking permissions and feature
  availability before running this operation.
  """

  import Ecto.Query, only: [from: 2]

  alias Ecto.Multi
  alias Operately.People.Person, as: CompanyPerson
  alias Operately.ProjectTemplates.{Comment, Discussion, Milestone, Person, ProjectTemplate, ResourceNode, Task, TaskAssignment}
  alias Operately.ProjectTemplates.Graph
  alias Operately.Repo
  alias __MODULE__.{Inserter, Planner}

  defstruct [:template_id, :creator_id, :name]

  def run(%__MODULE__{} = params) do
    Multi.new()
    |> Multi.run(:copy_plan, fn repo, _changes -> build_plan(repo, params) end)
    |> Multi.insert(:template, fn %{copy_plan: plan} -> ProjectTemplate.changeset(plan.target, plan.template_attrs) end)
    |> Multi.run(:template_children, fn repo, %{copy_plan: plan, template: template} -> Inserter.insert(repo, plan, template) end)
    |> Repo.transaction()
    |> extract_result()
  end

  defp build_plan(repo, params) do
    with {:ok, template} <- load_template(repo, params.template_id),
         {:ok, creator} <- load_creator(repo, params.creator_id),
         :ok <- validate_creator_scope(template, creator),
         :ok <- Graph.Validator.validate(template) do
      Planner.build(template, creator.id, params.name)
    end
  end

  defp load_template(repo, template_id) do
    case repo.get(ProjectTemplate, template_id) do
      nil ->
        {:error, :template_not_found}

      template ->
        {:ok,
         repo.preload(template,
           milestones: from(m in Milestone, order_by: [asc: m.inserted_at, asc: m.id]),
           tasks: from(t in Task, order_by: [asc: t.inserted_at, asc: t.id]),
           people: from(p in Person, order_by: [asc: p.inserted_at, asc: p.id]),
           task_assignments: from(a in TaskAssignment, order_by: [asc: a.inserted_at, asc: a.id]),
           discussions: from(d in Discussion, order_by: [asc: d.position, asc: d.id]),
           comments: from(c in Comment, order_by: [asc: c.parent_type, asc: c.parent_id, asc: c.position, asc: c.id]),
           resource_nodes: resource_nodes_query()
         )}
    end
  end

  defp resource_nodes_query do
    from(node in ResourceNode,
      order_by: [asc: node.parent_folder_id, asc: node.position, asc: node.id],
      preload: [folder: [], document: [], file: [], link: []]
    )
  end

  defp load_creator(repo, creator_id) do
    case repo.get(CompanyPerson, creator_id) do
      nil -> {:error, :creator_not_found}
      creator -> {:ok, creator}
    end
  end

  defp validate_creator_scope(template, creator) do
    if template.company_id == creator.company_id, do: :ok, else: {:error, :creator_scope_mismatch}
  end

  defp extract_result({:ok, %{template: template}}), do: {:ok, template}
  defp extract_result({:error, _step, reason, _changes}), do: {:error, reason}

  defmodule Planner do
    alias Operately.ProjectTemplates.{Milestone, Person, ProjectTemplate, Task}
    alias Operately.ProjectTemplates.Graph.{Copy, Kanban}
    alias OperatelyWeb.Paths

    def build(source, creator_id, name) do
      with {:ok, workflow} <- Copy.copy_workflow(source.task_statuses),
           {:ok, graph} <- plan_graph(source, workflow) do
        {:ok,
         graph
         |> Map.merge(plan_people(source, graph.tasks))
         |> Map.merge(%{
           target: %ProjectTemplate{id: Ecto.UUID.generate()},
           discussions: plan_discussions(source.discussions),
           comments: source.comments,
           resource_nodes: source.resource_nodes,
           template_attrs: %{
             company_id: source.company_id,
             space_id: source.space_id,
             creator_id: creator_id,
             source_project_id: nil,
             name: name,
             description: source.description,
             duration_days: source.duration_days,
             task_statuses: Enum.map(workflow.copied, &Copy.status_attrs/1),
             milestones_ordering_state: graph.milestones_ordering_state,
             tasks_kanban_state: graph.tasks_kanban_state,
             archived_at: nil,
             deleted_at: nil
           }
         })}
      else
        {:error, reason} -> {:error, {:invalid_template, reason}}
      end
    end

    defp plan_graph(source, workflow) do
      milestones = Enum.map(source.milestones, &%{source: &1, target: %Milestone{id: Ecto.UUID.generate()}})
      milestone_ids = Map.new(milestones, &{&1.source.id, &1.target.id})
      tasks = Enum.map(source.tasks, &plan_task(&1, milestone_ids, workflow))

      with {:ok, milestone_ordering} <-
             Copy.map_ordering(source.milestones_ordering_state, milestones, &source_milestone_path/1, &target_milestone_path/1),
           {:ok, root_kanban} <- plan_kanban(source.tasks_kanban_state, root_tasks(tasks), workflow),
           {:ok, milestones} <- plan_milestone_states(milestones, tasks, workflow) do
        {:ok,
         %{
           milestones: milestones,
           tasks: tasks,
           milestones_ordering_state: milestone_ordering,
           tasks_kanban_state: root_kanban
         }}
      end
    end

    defp plan_task(source, milestone_ids, workflow) do
      target_milestone_id = source.project_template_milestone_id && Map.fetch!(milestone_ids, source.project_template_milestone_id)
      target_status = Map.fetch!(workflow.copied_by_source_id, source.task_status.id)

      %{
        source: source,
        target: %Task{id: Ecto.UUID.generate(), project_template_milestone_id: target_milestone_id},
        task_status: Copy.status_attrs(target_status)
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
          error -> {:halt, error}
        end
      end)
    end

    defp plan_kanban(state, tasks, workflow) do
      Kanban.remap(state, tasks, workflow, &source_task_path/1, &target_task_path/1, & &1.source.task_status)
    end

    defp plan_people(source, tasks) do
      people = Enum.map(source.people, &%{source: &1, target: %Person{id: Ecto.UUID.generate()}})
      people_by_id = Map.new(people, &{&1.source.id, &1.target.id})
      tasks_by_id = Map.new(tasks, &{&1.source.id, &1.target.id})

      assignments =
        Enum.map(source.task_assignments, fn assignment ->
          %{
            source: assignment,
            target_task_id: Map.fetch!(tasks_by_id, assignment.project_template_task_id),
            target_person_id: Map.fetch!(people_by_id, assignment.project_template_person_id)
          }
        end)

      %{people: people, task_assignments: assignments}
    end

    defp plan_discussions(discussions) do
      Enum.map(discussions, &%{source: &1, target: %Operately.ProjectTemplates.Discussion{id: Ecto.UUID.generate()}})
    end

    defp source_milestone_path(planned), do: Paths.project_template_milestone_id(planned.source)
    defp target_milestone_path(planned), do: Paths.project_template_milestone_id(planned.target)
    defp source_task_path(planned), do: Paths.project_template_task_id(planned.source)
    defp target_task_path(planned), do: Paths.project_template_task_id(planned.target)
    defp root_tasks(tasks), do: Enum.filter(tasks, &is_nil(&1.source.project_template_milestone_id))
    defp milestone_tasks(tasks, milestone_id), do: Enum.filter(tasks, &(&1.source.project_template_milestone_id == milestone_id))
  end

  defmodule Inserter do
    alias Operately.ProjectTemplates.{Comment, Discussion, Milestone, Person, Resources, Task, TaskAssignment}

    def insert(repo, plan, template) do
      with {:ok, milestones} <- insert_milestones(repo, plan.milestones, template),
           {:ok, tasks} <- insert_tasks(repo, plan.tasks, template),
           {:ok, people} <- insert_people(repo, plan.people, template),
           {:ok, assignments} <- insert_assignments(repo, plan.task_assignments, template),
           {:ok, discussions} <- insert_discussions(repo, plan.discussions, template),
           {:ok, resources} <- Resources.duplicate(repo, plan.resource_nodes, template),
           {:ok, comments} <- insert_comments(repo, plan, template, discussions, resources) do
        {:ok,
         %{
           milestones: milestones,
           tasks: tasks,
           people: people,
           task_assignments: assignments,
           discussions: discussions,
           resource_nodes: resources.nodes,
           comments: comments
         }}
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
            due_offset_days: planned.source.due_offset_days,
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
            project_template_milestone_id: planned.target.project_template_milestone_id,
            name: planned.source.name,
            description: planned.source.description,
            priority: planned.source.priority,
            size: planned.source.size,
            due_offset_days: planned.source.due_offset_days,
            reminders: Enum.map(planned.source.reminders, &reminder_attrs/1),
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
            person_id: planned.source.person_id,
            role: planned.source.role,
            responsibility: planned.source.responsibility,
            access_level: planned.source.access_level
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
          TaskAssignment.changeset(%{
            project_template_id: template.id,
            project_template_task_id: planned.target_task_id,
            project_template_person_id: planned.target_person_id
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
            body: planned.source.body,
            position: planned.source.position
          })
        end,
        repo,
        :discussion
      )
    end

    defp insert_comments(repo, plan, template, discussions, resources) do
      discussion_ids = Map.new(Enum.zip(plan.discussions, discussions), fn {planned, copied} -> {planned.source.id, copied.id} end)

      Comment.duplicate(repo, plan.comments, template, %{
        discussion: discussion_ids,
        document: resources.parent_ids.document,
        file: resources.parent_ids.file,
        link: resources.parent_ids.link
      })
    end

    defp insert_all(resources, changeset_fun, repo, type) do
      Enum.reduce_while(resources, {:ok, []}, fn resource, {:ok, inserted} ->
        case repo.insert(changeset_fun.(resource)) do
          {:ok, value} -> {:cont, {:ok, inserted ++ [value]}}
          {:error, changeset} -> {:halt, {:error, {:invalid_child, type, changeset}}}
        end
      end)
    end

    defp reminder_attrs(reminder), do: %{type: reminder.type, days: reminder.days, date: reminder.date}
  end
end
