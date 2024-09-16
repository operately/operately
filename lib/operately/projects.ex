defmodule Operately.Projects do
  import Ecto.Query, warn: false

  alias Operately.Repo
  alias Ecto.Multi

  alias Operately.People.Person
  alias Operately.Updates
  alias Operately.Activities
  alias Operately.Access.Fetch

  alias Operately.Projects.{
    Project,
    PhaseHistory,
    Contributor,
    Milestone,
    ReviewRequest,
    Document,
    KeyResource,
    CheckIn
  }

  def get_project!(id) do
    query = from p in Project, where: p.id == ^id

    Repo.one(query, with_deleted: true)
  end

  def get_project_with_access_level(project_id, person_id) do
    from(p in Project, as: :resource, where: p.id == ^project_id)
    |> Fetch.get_resource_with_access_level(person_id)
  end

  def get_check_in!(id) do
    Repo.get!(CheckIn, id)
  end

  def get_check_ins!(project_id) do
    Repo.all(from c in CheckIn, where: c.project_id == ^project_id, order_by: [desc: c.inserted_at])
  end

  def get_check_in_with_access_level(check_in_id, person_id) do
    from(c in CheckIn, as: :resource, where: c.id == ^check_in_id)
    |> Fetch.get_resource_with_access_level(person_id)
  end

  def update_check_in(%CheckIn{} = check_in, attrs) do
    check_in
    |> CheckIn.changeset(attrs)
    |> Repo.update()
  end

  defdelegate create_project(params), to: Operately.Operations.ProjectCreation, as: :run
  defdelegate list_projects(person, filters), to: Operately.Projects.ListOperation, as: :run

  def update_project(%Project{} = project, attrs) do
    project
    |> Project.changeset(attrs)
    |> Repo.update()
  end

  def rename_project(author, project, new_name) do
    Multi.new()
    |> Multi.update(:project, change_project(project, %{name: new_name}))
    |> Activities.insert_sync(author.id, :project_renamed, fn changes -> %{
      company_id: project.company_id,
      project_id: project.id,
      old_name: project.name,
      new_name: changes.project.name
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  def archive_project(author, %Project{} = project) do
    Multi.new()
    |> Multi.run(:project, fn repo, _ -> repo.soft_delete(project) end)
    |> Activities.insert_sync(author.id, :project_archived, fn changes -> %{
      company_id: project.company_id,
      project_id: changes.project.id
    } end)
    |> Repo.transaction()
    |> Repo.extract_result(:project)
  end

  def change_project(%Project{} = project, attrs \\ %{}) do
    Project.changeset(project, attrs)
  end

  def get_milestones(ids) do
    Repo.all(from m in Milestone, where: m.id in ^ids)
  end

  def get_milestone!(id, opts \\ []), do: Repo.get!(Milestone, id, opts)

  def get_milestone_by_name(project, milestone_name) do
    Repo.one(from m in Milestone,
      where: m.project_id == ^project.id,
      where: m.title == ^milestone_name)
  end

  def get_next_milestone(project) do
    query = from m in Milestone,
      where: m.project_id == ^project.id,
      where: m.status == ^:pending,
      order_by: [asc: m.deadline_at],
      limit: 1

    Repo.one(query)
  end

  def get_milestone_with_access_level(milestone_id, person_id) do
    from(m in Milestone, as: :resource, where: m.id == ^milestone_id)
    |> Fetch.get_resource_with_access_level(person_id)
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

  def uncomplete_milestone(_person, milestone) do
    Repo.transaction(fn ->
      {:ok, milestone} = update_milestone(milestone, %{status: :pending, completed_at: nil})

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

  def delete_milestone(person, %Milestone{} = milestone) do
    Repo.transaction(fn ->
      {:ok, _} = Updates.record_project_milestone_deleted(person, milestone)

      {:ok, milestone} = Repo.soft_delete(milestone)

      milestone
    end)
  end

  def change_milestone(%Milestone{} = milestone, attrs \\ %{}) do
    Milestone.changeset(milestone, attrs)
  end

  def get_contributor!(person_id: person_id, project_id: project_id) do
    Repo.one(from c in Contributor, where: c.person_id == ^person_id and c.project_id == ^project_id)
  end

  def get_contributor!(id) do
    Repo.get!(Contributor, id)
  end

  def get_contributor_role!(project, person_id) do
    Repo.one(from c in Contributor,
      where: c.project_id == ^project.id,
      where: c.person_id == ^person_id,
      select: c.role,
      limit: 1)
  end

  def get_person_by_role(project, role) do
    query = from p in Person,
      inner_join: c in Contributor, on: c.person_id == p.id,
      where: c.project_id == ^project.id,
      where: c.role == ^role,
      limit: 1

    Repo.one(query)
  end

  def get_champion(project) do
    get_person_by_role(project, :champion)
  end

  def get_reviewer(project) do
    get_person_by_role(project, :reviewer)
  end

  def list_project_contributors(project) do
    query = (from c in Contributor, where: c.project_id == ^project.id, preload: :person)

    query
    |> Contributor.order_by_role_and_insertion_at()
    |> Repo.all()
  end

  def list_project_contributor_candidates(company_id, project_id, query, exclude_ids, limit) do
    ilike_pattern = "%#{query}%"

    query = (
      from person in Person,
      left_join: contrib in Contributor, on: contrib.project_id == ^project_id and contrib.person_id == person.id,
      where: is_nil(contrib.project_id),
      where: person.id not in ^exclude_ids,
      where: ilike(person.full_name, ^ilike_pattern) or ilike(person.title, ^ilike_pattern),
      where: not person.suspended and person.company_id == ^company_id,
      limit: ^limit
    )

    Repo.all(query)
  end

  def list_notification_subscribers(project_id, exclude: author_id) do
    query = from p in Person,
      join: c in Contributor, on: c.person_id == p.id,
      where: c.project_id == ^project_id,
      where: p.id != ^author_id,
      where: not is_nil(p.email) and p.notify_about_assignments

    Repo.all(query)
  end

  defdelegate create_contributor(author, attrs), to: Operately.Operations.ProjectContributorAddition, as: :run

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

  def list_key_resources(project) do
    Operately.Repo.preload(project, :key_resources).key_resources
  end

  def get_key_resource!(id), do: Repo.get!(KeyResource, id)

  def get_key_resource_with_access_level(key_resource_id, person_id) do
    from(r in KeyResource, as: :resource, where: r.id == ^key_resource_id)
    |> Fetch.get_resource_with_access_level(person_id)
  end

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

      {:ok, phase} = create_phase_history(%{
        project_id: project.id,
        phase: new_phase,
        start_time: DateTime.utc_now()
      })

      phase
    end)
  end

  def list_project_review_requests do
    Repo.all(ReviewRequest)
  end

  def list_project_review_requests(project) do
    Repo.all(from rr in ReviewRequest, where: rr.project_id == ^project.id)
  end

  def list_pending_project_review_requests(project) do
    Repo.all(from rr in ReviewRequest, where: rr.project_id == ^project.id, where: rr.status == ^:pending)
  end

  def get_review_request!(id), do: Repo.get!(ReviewRequest, id)
  def get_review_request(id), do: {:ok, Repo.get(ReviewRequest, id)}

  def update_review_request(%ReviewRequest{} = review_request, attrs) do
    review_request
    |> ReviewRequest.changeset(attrs)
    |> Repo.update()
  end

  def delete_review_request(%ReviewRequest{} = review_request) do
    Repo.delete(review_request)
  end

  def change_review_request(%ReviewRequest{} = review_request, attrs \\ %{}) do
    ReviewRequest.changeset(review_request, attrs)
  end

  def outdated?(project) do
    if project.next_check_in_scheduled_at do
      today = Date.utc_today()
      check_in_day = DateTime.to_date(project.next_check_in_scheduled_at)
      check_in_missed_by = Date.diff(today, check_in_day)

      cond do
        project.status == "closed" -> false
        project.status == "paused" -> false
        project.deleted_at != nil -> false
        check_in_missed_by > 3 -> true
        true -> false
      end
    else
      true
    end
  end
end
