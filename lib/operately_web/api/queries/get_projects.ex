defmodule OperatelyWeb.Api.Queries.GetProjects do
  use TurboConnect.Query
  use OperatelyWeb.Api.Helpers

  alias Operately.Projects.Project
  alias Operately.Projects.Contributor

  inputs do
    field :only_my_projects, :boolean
    field :only_reviewed_by_me, :boolean

    field :space_id, :string
    field :goal_id, :string

    field :include_space, :boolean
    field :include_milestones, :boolean
    field :include_contributors, :boolean
    field :include_last_check_in, :boolean
    field :include_champion, :boolean
    field :include_goal, :boolean
    field :include_archived, :boolean
  end

  outputs do
    field :projects, list_of(:project)
  end

  def call(conn, inputs) do
    projects = load(me(conn), inputs)
    {:ok, %{projects: serialize(projects, inputs)}}
  end

  defp load(person, inputs) do
    (from p in Project, as: :project, where: p.company_id == ^person.company_id)
    |> apply_visibility_filter(person)
    |> apply_role_filter(person, inputs)
    |> extend_query(inputs[:space_id], fn q -> from p in q, where: p.group_id == ^inputs.space_id end)
    |> extend_query(inputs[:goal_id], fn q -> from p in q, where: p.goal_id == ^inputs.goal_id end)
    |> extend_query(inputs[:include_space], fn q -> from p in q, preload: [:group] end)
    |> extend_query(inputs[:include_contributors], fn q -> from p in q, preload: [contributors: :person] end)
    |> extend_query(inputs[:include_last_check_in], fn q -> from p in q, preload: [last_check_in: :author] end)
    |> extend_query(inputs[:include_champion], fn q -> from p in q, preload: [:champion] end)
    |> extend_query(inputs[:include_goal], fn q -> from p in q, preload: [:goal] end)
    |> extend_query(inputs[:include_archived], fn q -> from p in q, where: is_nil(p.deleted_at) end)
    |> extend_query(inputs[:include_milestones], fn q -> from p in q, preload: [:milestones] end)
    |> Repo.all()
    |> set_next_milestones(inputs[:include_milestones])
  end

  defp apply_visibility_filter(query, person) do
    from p in query, where: not(p.private) or exists(contributor_subquery(person))
  end
  
  defp apply_role_filter(query, person, inputs) do
    cond do
      inputs[:only_reviewed_by_me] ->
        from p in query, where: exists(contributor_subquery(person, [:reviewer]))
      inputs[:only_my_projects] ->
        from p in query, where: exists(contributor_subquery(person, [:champion, :contributor]))
      true ->
        query
    end
  end

  defp contributor_subquery(person) do
    from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id
  end

  defp contributor_subquery(person, roles) do
    from c in Contributor, where: c.project_id == parent_as(:project).id and c.person_id == ^person.id and c.role in ^roles
  end

  defp set_next_milestones(projects, true), do: Project.set_next_milestone(projects)
  defp set_next_milestones(projects, _), do: projects

  defp serialize(projects, inputs) when is_list(projects) do
    Enum.map(projects, fn p -> serialize(p, inputs) end)
  end

  defp serialize(project = %Operately.Projects.Project{}, inputs) do
    %{
      id: project.id,
      name: project.name,
      private: project.private,
      inserted_at: project.inserted_at,
      updated_at: project.updated_at,
      started_at: project.started_at,
      closed_at: project.closed_at,
      deadline: project.deadline,
      is_archived: project.deleted_at != nil,
      is_outdated: Operately.Projects.outdated?(project),
      status: project.status,
    }
    |> extend_map_if(inputs[:include_space], fn -> %{space: serialize_space(project.group)} end)
    |> extend_map_if(inputs[:include_champion], fn -> %{champion: serialize_champion(project.champion)} end)
    |> extend_map_if(inputs[:include_goal], fn -> %{goal: serialize_goal(project.goal)} end)
    |> extend_map_if(inputs[:include_milestones], fn -> %{milestones: serialize_milestones(project.milestones)} end)
    |> extend_map_if(inputs[:include_contributors], fn -> %{contributors: serialize_contributors(project.contributors)} end)
    |> extend_map_if(inputs[:include_last_check_in], fn -> %{last_check_in: serialize_last_check_in(project.last_check_in)} end)
    |> extend_map_if(inputs[:include_milestones], fn -> %{next_milestone: serialize_milestone(project.next_milestone)} end)
  end

  defp serialize_space(space) do
    %{
      id: space.id,
      name: space.name,
    }
  end

  defp serialize_champion(nil), do: nil
  defp serialize_champion(champion) do
    %{
      id: champion.id,
      full_name: champion.full_name,
      avatar_url: champion.avatar_url,
      title: champion.title,
    }
  end

  defp serialize_goal(nil), do: nil
  defp serialize_goal(goal) do
    %{
      id: goal.id,
      name: goal.name,
    }
  end

  def serialize_milestones(milestones) do
    Enum.map(milestones, fn milestone -> serialize_milestone(milestone) end)
  end

  defp serialize_milestone(nil), do: nil
  defp serialize_milestone(milestone) do
    %{
      id: milestone.id,
      title: milestone.title,
      status: milestone.status,
      inserted_at: milestone.inserted_at,
      deadline_at: milestone.deadline_at,
    }
  end

  defp serialize_last_check_in(nil), do: nil
  defp serialize_last_check_in(last_check_in) do
    %{
      id: last_check_in.id,
      status: last_check_in.status,
      description: last_check_in.description,
      inserted_at: last_check_in.inserted_at,

      author: %{
        id: last_check_in.author.id,
        full_name: last_check_in.author.full_name,
        avatar_url: last_check_in.author.avatar_url,
        title: last_check_in.author.title,
      }
    }
  end

  defp serialize_contributors(contributors) do
    Enum.map(contributors, fn contributor ->
      %{
        id: contributor.id,
        role: contributor.role,
        responsibility: contributor.responsibility,
        person: %{
          id: contributor.person.id,
          full_name: contributor.person.full_name,
          avatar_url: contributor.person.avatar_url,
          title: contributor.person.title,
        }
      }
    end)
  end
end
