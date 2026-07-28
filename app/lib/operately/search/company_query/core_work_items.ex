defmodule Operately.Search.CompanyQuery.CoreWorkItems do
  @moduledoc """
  Builds the canonical project, goal, and discussion set eligible for company search.

  The returned metadata is authoritative for company, access-context, and scope
  validation. Search entries that no longer match it are rejected before ranking.
  """

  import Ecto.Query

  alias Operately.Goals.Goal
  alias Operately.Messages.Message
  alias Operately.Projects.Project

  def query(company_id) do
    project_query(company_id)
    |> union_all(^goal_query(company_id))
    |> union_all(^discussion_query(company_id))
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
        owner_name: space.name
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
        owner_name: space.name
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
        owner_name: space.name
      }
    )
  end
end
