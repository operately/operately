defmodule Operately.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Projects.Project
  alias Operately.Projects.Contributor
  alias Operately.People.Person


  def get_project!(id) do
    Repo.get!(Project, id)
  end

  def list_projects(filters \\ %{}) do
    Operately.Projects.ListQuery.build(filters) |> Repo.all()
  end

  def create_project(attrs \\ %{}, _creator_id) do
    next_update_scheduled_at = attrs[:next_update_scheduled_at] || DateTime.add(DateTime.utc_now(), 7, :day)
    attrs = Map.put(attrs, :next_update_scheduled_at, next_update_scheduled_at)

    %Project{}
    |> Project.changeset(attrs)
    |> Repo.insert()
  end

  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  def delete_project(%Project{} = project) do
    Repo.delete(project)
  end

  def change_project(%Project{} = project, attrs \\ %{}) do
    Project.changeset(project, attrs)
  end

  alias Operately.Projects.Milestone

  def get_milestone!(id) do
    Repo.get!(Milestone, id)
  end

  def list_project_milestones(project) do
    query = from m in Milestone,
      where: m.project_id == ^project.id,
      order_by: [asc: m.id]

    Repo.all(query)
  end

  def create_milestone(attrs \\ %{}) do
    %Milestone{}
    |> Milestone.changeset(attrs)
    |> Repo.insert()
  end

  def update_milestone(%Milestone{} = milestone, attrs) do
    milestone
    |> Milestone.changeset(attrs)
    |> Repo.update()
  end

  def delete_milestone(%Milestone{} = milestone) do
    Repo.delete(milestone)
  end

  def change_milestone(%Milestone{} = milestone, attrs \\ %{}) do
    Milestone.changeset(milestone, attrs)
  end

  alias Operately.Projects.Contributor

  def get_contributor!(id) do
    Repo.get!(Contributor, id)
  end

  def get_person_by_role(project, role) do
    query = from p in Person,
      inner_join: c in Contributor, on: c.person_id == p.id,
      where: c.project_id == ^project.id,
      where: c.role == ^role,
      limit: 1

    Repo.one!(query)
  end

  def list_project_contributors(project) do
    query = (from c in Contributor, where: c.project_id == ^project.id)
    
    query
    |> Contributor.order_by_role_and_insertion_at()
    |> Repo.all()
  end

  def list_project_contributor_candidates(project_id, query, exclude_ids, limit) do
    ilike_pattern = "%#{query}%"

    query = (
      from person in Person,
      left_join: contrib in Contributor, on: contrib.project_id == ^project_id and contrib.person_id == person.id,
      where: is_nil(contrib.project_id),
      where: person.id not in ^exclude_ids,
      where: ilike(person.full_name, ^ilike_pattern) or ilike(person.title, ^ilike_pattern),
      limit: ^limit
    )

    Repo.all(query)
  end

  def create_contributor(attrs \\ %{}) do
    %Contributor{}
    |> Contributor.changeset(attrs)
    |> Repo.insert()
  end

  def update_contributor(%Contributor{} = contributor, attrs) do
    contributor
    |> Contributor.changeset(attrs)
    |> Repo.update()
  end

  def delete_contributor(%Contributor{} = contributor) do
    Repo.delete(contributor)
  end

  def change_contributor(%Contributor{} = contributor, attrs \\ %{}) do
    Contributor.changeset(contributor, attrs)
  end
end
