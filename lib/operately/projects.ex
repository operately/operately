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
  alias Operately.Updates

  def get_project!(id) do
    Repo.get!(Project, id)
  end

  def list_projects(person, filters \\ %{}) do
    Operately.Projects.ListQuery.build(person, filters) |> Repo.all()
  end

  def create_project(%Operately.Projects.ProjectCreation{} = params) do
    Operately.Projects.ProjectCreation.run(params)
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

  def get_next_milestone(project) do
    query = from m in Milestone,
      where: m.project_id == ^project.id,
      where: m.status == ^:pending,
      order_by: [asc: m.deadline_at],
      limit: 1

    Repo.one(query)
  end

  def list_project_milestones(project) do
    query = from m in Milestone,
      where: m.project_id == ^project.id,
      order_by: [asc: m.id]

    Repo.all(query)
  end

  def create_milestone(creator, attrs) do
    Repo.transaction(fn ->
      result = %Milestone{} |> Milestone.changeset(attrs) |> Repo.insert()

      case result do
        {:ok, milestone} ->
          {:ok, _} = Updates.record_project_milestone_creation(creator, milestone)
          milestone

        {:error, changeset} ->
          Repo.rollback(changeset)
      end
    end)
  end

  def complete_milestone(person, milestone) do
    Repo.transaction(fn ->
      {:ok, milestone} = update_milestone(milestone, %{status: :done, completed_at: DateTime.utc_now()})
      {:ok, _} = Updates.record_project_milestone_completed(person, milestone)

      milestone
    end)
  end

  def uncomplete_milestone(person, milestone) do
    Repo.transaction(fn ->
      {:ok, milestone} = update_milestone(milestone, %{status: :pending, completed_at: nil})
      {:ok, _} = Activities.submit_milestone_uncompleted(person.id, milestone)

      milestone
    end)
  end

  def update_milestone_deadline(person, milestone, deadline) do
    Repo.transaction(fn ->
      old_deadline = milestone.deadline_at
      new_deadline = deadline

      {:ok, milestone} = update_milestone(milestone, %{deadline_at: deadline})
      {:ok, _} = Updates.record_project_milestone_deadline_changed(person, milestone, old_deadline, new_deadline)

      milestone
    end)
  end

  def update_milestone(%Milestone{} = milestone, attrs) do
    milestone
    |> Milestone.changeset(attrs)
    |> Repo.update()
  end

  def delete_milestone(%Milestone{} = milestone) do
    Repo.soft_delete(milestone)
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

    Repo.one(query)
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
    create_contributor(Map.merge(attrs, %{
      project_id: project_id,
      role: :champion
    }))
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

  alias Operately.Projects.KeyResource

  def list_key_resources(project) do
    Operately.Repo.preload(project, :key_resources).key_resources
  end

  def get_key_resource!(id), do: Repo.get!(KeyResource, id)

  def create_key_resource(attrs \\ %{}) do
    %KeyResource{}
    |> KeyResource.changeset(attrs)
    |> Repo.insert()
  end

  def update_key_resource(%KeyResource{} = key_resource, attrs) do
    key_resource
    |> KeyResource.changeset(attrs)
    |> Repo.update()
  end

  def delete_key_resource(%KeyResource{} = key_resource) do
    Repo.delete(key_resource)
  end

  def change_key_resource(%KeyResource{} = key_resource, attrs \\ %{}) do
    KeyResource.changeset(key_resource, attrs)
  end

  # Phase History

  alias Operately.Projects.PhaseHistory

  def list_project_phase_history(project) do
    Operately.Repo.preload(project, :phase_history).phase_history
  end

  def get_phase_history!(id), do: Repo.get!(PhaseHistory, id)

  def create_phase_history(attrs \\ %{}) do
    %PhaseHistory{}
    |> PhaseHistory.changeset(attrs)
    |> Repo.insert()
  end

  def update_phase_history(%PhaseHistory{} = phase_history, attrs) do
    phase_history
    |> PhaseHistory.changeset(attrs)
    |> Repo.update()
  end

  def delete_phase_history(%PhaseHistory{} = phase_history) do
    Repo.delete(phase_history)
  end

  def change_phase_history(%PhaseHistory{} = phase_history, attrs \\ %{}) do
    PhaseHistory.changeset(phase_history, attrs)
  end

  def find_first_phase_history(project_id) do
    Repo.one(from ph in PhaseHistory,
      where: ph.project_id == ^project_id,
      where: ph.phase == ^:planning,
      order_by: [asc: ph.start_time],
      limit: 1)
  end

  def record_phase_history(project, old_phase, new_phase) do
    Repo.transaction(fn ->
      previous_phase_history = Repo.one(from ph in PhaseHistory,
        where: ph.project_id == ^project.id,
        where: ph.phase == ^old_phase,
        where: is_nil(ph.end_time),
        limit: 1)

      if previous_phase_history do
        previous_phase_history
        |> PhaseHistory.changeset(%{end_time: DateTime.utc_now()})
        |> Repo.update()
      end
      
      {:ok, _} = create_phase_history(%{
        project_id: project.id,
        phase: new_phase,
        start_time: DateTime.utc_now()
      })
    end)
  end

  def get_permissions(project, person) do
    Operately.Projects.Permissions.calculate_permissions(project, person)
  end
end
