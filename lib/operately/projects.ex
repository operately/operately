defmodule Operately.Projects do
  @moduledoc """
  The Projects context.
  """

  import Ecto.Query, warn: false
  alias Operately.Repo

  alias Operately.Projects.Project
  alias Operately.Projects.Contributor
  alias Operately.People.Person
  alias Operately.Activities

  def get_project!(id) do
    Repo.get!(Project, id)
  end

  def list_projects(filters \\ %{}) do
    Operately.Projects.ListQuery.build(filters) |> Repo.all()
  end

  def create_project(attrs) do
    create_project(attrs, nil)
  end

  def create_project(project_attrs, champion_attrs) do
    Repo.transaction(fn ->
      result = %Project{} |> Project.changeset(project_attrs) |> Repo.insert()

      case result do
        {:ok, project} -> 
          {:ok, champion} = create_contributor_if_provided(champion_attrs, project.id)
          {:ok, _} = Activities.submit_project_created(project, champion)

          project

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
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

  def create_contributor_if_provided(nil, _project_id) do
    {:ok, nil}
  end

  def create_contributor_if_provided(attrs, project_id) do
    create_contributor(Map.merge(attrs, %{project_id: project_id}))
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

  alias Operately.Projects.Document

  def get_pitch(project) do
    Repo.preload(project, :pitch).pitch
  end

  def get_plan(project) do
    Repo.preload(project, :plan).plan
  end

  def get_execution_review(project) do
    Repo.preload(project, :execution_review).execution_review
  end

  def get_control_review(project) do
    Repo.preload(project, :control_review).control_review
  end

  def get_retrospective(project) do
    Repo.preload(project, :retrospective).retrospective
  end

  def list_project_documents do
    Repo.all(Document)
  end

  def get_document!(id), do: Repo.get!(Document, id)

  def create_document(attrs \\ %{}) do
    %Document{}
    |> Document.changeset(attrs)
    |> Repo.insert()
  end

  def update_document(%Document{} = document, attrs) do
    document
    |> Document.changeset(attrs)
    |> Repo.update()
  end

  def delete_document(%Document{} = document) do
    Repo.delete(document)
  end

  def change_document(%Document{} = document, attrs \\ %{}) do
    Document.changeset(document, attrs)
  end
end
