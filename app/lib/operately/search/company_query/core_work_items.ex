defmodule Operately.Search.CompanyQuery.CoreWorkItems do
  @moduledoc """
  Builds the canonical core-work set eligible for company search.

  The returned metadata is authoritative for company, access-context, and scope
  validation. Parent-owned records also validate publication and inherited state.
  Search entries that no longer match current canonical data are rejected before ranking.
  """

  import Ecto.Query

  alias Operately.Companies.Company
  alias Operately.Goals.{Goal, Update}
  alias Operately.Groups.Group
  alias Operately.Messages.Message
  alias Operately.People.Person
  alias Operately.Projects.{CheckIn, Milestone, Project, Retrospective}
  alias Operately.Tasks.Task

  def query(company_id) do
    project_query(company_id)
    |> union_all(^goal_query(company_id))
    |> union_all(^milestone_query(company_id))
    |> union_all(^project_task_query(company_id))
    |> union_all(^space_task_query(company_id))
    |> union_all(^person_query(company_id))
    |> union_all(^discussion_query(company_id))
    |> union_all(^project_check_in_query(company_id))
    |> union_all(^goal_check_in_query(company_id))
    |> union_all(^project_retrospective_query(company_id))
  end

  defp milestone_query(company_id) do
    from(milestone in Milestone,
      join: project in assoc(milestone, :project),
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: project.company_id == ^company_id,
      where: is_nil(milestone.deleted_at) and is_nil(project.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"milestone", :string),
        source_id: milestone.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        owner_name: project.name,
        expected_state:
          type(
            # Returns completed for a finished milestone, the project's closed or paused state, or nil.
            fragment(
              "CASE WHEN ? = 'done' OR ? IS NOT NULL THEN 'completed' WHEN ? IS NOT NULL OR ? = 'closed' THEN 'closed' WHEN ? = 'paused' THEN 'paused' ELSE NULL END",
              milestone.status,
              milestone.completed_at,
              project.closed_at,
              project.status,
              project.status
            ),
            :string
          )
      }
    )
  end

  defp project_task_query(company_id) do
    from(task in Task,
      join: project in assoc(task, :project),
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: project.company_id == ^company_id,
      where: is_nil(project.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"task", :string),
        source_id: task.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        owner_name: project.name,
        expected_state:
          type(
            # Returns completed for a finished task, the project's closed or paused state, or nil.
            fragment(
              "CASE WHEN ? IS NOT NULL OR coalesce((?->>'closed')::boolean, false) OR ? IN ('done', 'canceled') THEN 'completed' WHEN ? IS NOT NULL OR ? = 'closed' THEN 'closed' WHEN ? = 'paused' THEN 'paused' ELSE NULL END",
              task.closed_at,
              task.task_status,
              task.status,
              project.closed_at,
              project.status,
              project.status
            ),
            :string
          )
      }
    )
  end

  defp space_task_query(company_id) do
    from(task in Task,
      join: space in Group,
      on: space.id == task.space_id,
      join: context in assoc(space, :access_context),
      where: space.company_id == ^company_id and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"task", :string),
        source_id: task.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: space.company_id,
        access_context_id: context.id,
        space_id: space.id,
        project_id: type(^nil, :binary_id),
        goal_id: type(^nil, :binary_id),
        owner_name: space.name,
        expected_state:
          type(
            # Returns completed for a finished task, or nil.
            fragment(
              "CASE WHEN ? IS NOT NULL OR coalesce((?->>'closed')::boolean, false) OR ? IN ('done', 'canceled') THEN 'completed' ELSE NULL END",
              task.closed_at,
              task.task_status,
              task.status
            ),
            :string
          )
      }
    )
  end

  defp person_query(company_id) do
    from(person in Person,
      join: company in Company,
      on: company.id == person.company_id,
      join: context in assoc(company, :access_context),
      where: person.company_id == ^company_id,
      where: person.suspended == false and is_nil(person.suspended_at),
      select: %{
        source_type: type(^"person", :string),
        source_id: person.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: company.id,
        access_context_id: context.id,
        space_id: type(^nil, :binary_id),
        project_id: type(^nil, :binary_id),
        goal_id: type(^nil, :binary_id),
        owner_name: company.name,
        expected_state: type(^nil, :string)
      }
    )
  end

  defp project_query(company_id) do
    from(project in Project,
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: project.company_id == ^company_id and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"project", :string),
        source_id: project.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        owner_name: space.name,
        expected_state: type(^nil, :string)
      }
    )
  end

  defp goal_query(company_id) do
    from(goal in Goal,
      join: space in assoc(goal, :group),
      join: context in assoc(goal, :access_context),
      where: goal.company_id == ^company_id,
      where: is_nil(goal.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"goal", :string),
        source_id: goal.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: goal.company_id,
        access_context_id: context.id,
        space_id: goal.group_id,
        project_id: type(^nil, :binary_id),
        goal_id: goal.id,
        owner_name: space.name,
        expected_state: type(^nil, :string)
      }
    )
  end

  defp discussion_query(company_id) do
    from(message in Message,
      join: board in assoc(message, :messages_board),
      join: space in assoc(board, :space),
      join: context in assoc(space, :access_context),
      where: space.company_id == ^company_id,
      where: message.state == :published and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"discussion", :string),
        source_id: message.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: space.company_id,
        access_context_id: context.id,
        space_id: space.id,
        project_id: type(^nil, :binary_id),
        goal_id: type(^nil, :binary_id),
        owner_name: space.name,
        expected_state: type(^nil, :string)
      }
    )
  end

  defp project_check_in_query(company_id) do
    from(check_in in CheckIn,
      join: project in assoc(check_in, :project),
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: project.company_id == ^company_id,
      where: check_in.state == :published,
      where: is_nil(project.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"project_check_in", :string),
        source_id: check_in.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        owner_name: project.name,
        expected_state:
          type(
            # Returns the project's closed or paused state, or nil.
            fragment(
              "CASE WHEN ? IS NOT NULL OR ? = 'closed' THEN 'closed' WHEN ? = 'paused' THEN 'paused' ELSE NULL END",
              project.closed_at,
              project.status,
              project.status
            ),
            :string
          )
      }
    )
  end

  defp goal_check_in_query(company_id) do
    from(check_in in Update,
      join: goal in assoc(check_in, :goal),
      join: space in assoc(goal, :group),
      join: context in assoc(goal, :access_context),
      where: goal.company_id == ^company_id,
      where: check_in.state == :published,
      where: is_nil(goal.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"goal_check_in", :string),
        source_id: check_in.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: goal.company_id,
        access_context_id: context.id,
        space_id: goal.group_id,
        project_id: type(^nil, :binary_id),
        goal_id: goal.id,
        owner_name: goal.name,
        expected_state:
          type(
            # Returns closed for a closed goal, or nil.
            fragment("CASE WHEN ? IS NOT NULL THEN 'closed' ELSE NULL END", goal.closed_at),
            :string
          )
      }
    )
  end

  defp project_retrospective_query(company_id) do
    from(retrospective in Retrospective,
      join: project in assoc(retrospective, :project),
      join: space in assoc(project, :group),
      join: context in assoc(project, :access_context),
      where: project.company_id == ^company_id,
      where: is_nil(project.deleted_at) and is_nil(space.deleted_at),
      select: %{
        source_type: type(^"project_retrospective", :string),
        source_id: retrospective.id,
        node_id: type(^nil, :binary_id),
        parent_folder_id: type(^nil, :binary_id),
        resource_hub_id: type(^nil, :binary_id),
        company_id: project.company_id,
        access_context_id: context.id,
        space_id: project.group_id,
        project_id: project.id,
        goal_id: project.goal_id,
        owner_name: project.name,
        expected_state:
          type(
            # Returns the project's closed or paused state, or nil.
            fragment(
              "CASE WHEN ? IS NOT NULL OR ? = 'closed' THEN 'closed' WHEN ? = 'paused' THEN 'paused' ELSE NULL END",
              project.closed_at,
              project.status,
              project.status
            ),
            :string
          )
      }
    )
  end
end
