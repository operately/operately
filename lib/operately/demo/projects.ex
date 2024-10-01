defmodule Operately.Demo.Projects do
  alias Operately.Demo.Resources

  def create_projects(resources, data) do
    Resources.create(resources, data, fn {resources, data} ->
      create_project(resources, data)
    end)
  end

  def create_project(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)
    champion = Resources.get(resources, data.champion)
    reviewer = Resources.get(resources, data.reviewer)
    space = Resources.get(resources, data.space)
    goal = data.goal && Resources.get(resources, data.goal)

    params = %Operately.Operations.ProjectCreation{
      company_id: company.id,
      name: data.name,
      champion_id: champion.id,
      reviewer_id: reviewer.id,
      creator_id: owner.id,
      creator_role: "contributor",
      creator_is_contributor: "yes",
      visibility: "everyone",
      group_id: space.id,
      goal_id: goal.id,
      anonymous_access_level: 0,
      company_access_level: 70,
      space_access_level: 70,
    }

    {:ok, project} = Operately.Operations.ProjectCreation.run(params)
    {:ok, project} = set_description(project, data[:description])
    {:ok, project} = set_project_timeline(champion, project)
    {:ok, project} = create_project_milestones(champion, project, data.milestones)

    {:ok, _check_in} = create_project_check_in(champion, project, data.check_in)

    add_project_contributors(resources, project, data)

    project
  end

  def set_description(project, value) do
    Operately.Projects.update_project(project, %{description: Operately.Demo.RichText.from_string(value || "")})
  end

  def set_project_timeline(champion, project) do
    start = Date.utc_today() |> Date.add(:rand.uniform(20)) |> Date.add(-:rand.uniform(20))
    deadline = start |> Date.add(10 + :rand.uniform(20))

    Operately.Projects.EditTimelineOperation.run(champion, project, %{
      project_start_date: DateTime.new!(start, ~T[00:00:00], "Etc/UTC"),
      project_due_date: DateTime.new!(deadline, ~T[00:00:00], "Etc/UTC"),
      milestone_updates: [],
      new_milestones: []
    })
  end

  def create_project_check_in(_champion, project, nil) do
    Operately.Projects.update_project(project, %{next_check_in_scheduled_at: yesterday()})
  end

  def create_project_check_in(champion, project, data) do
    Operately.Operations.ProjectCheckIn.run(champion, project, Map.merge(%{
      content: Operately.Demo.RichText.from_string(data.content),
      status: data.status,
    }, %{
      subscription_parent_type: :project_check_in,
      subscriber_ids: []
    }))
  end

  def yesterday do
    Date.utc_today() |> Date.add(-1) |> DateTime.new!(~T[00:00:00], "Etc/UTC")
  end

  def create_project_milestones(champion, project, data) do
    {:ok, _} = Operately.Projects.EditTimelineOperation.run(champion, project, %{
      project_start_date: project.started_at,
      project_due_date: project.deadline,
      milestone_updates: [],
      new_milestones: Enum.map(data, fn m ->
        %{
          title: m.title,
          due_time: yesterday(),
          description: Operately.Demo.RichText.from_string(""),
          status: m.status,
          tasks_kanban_state: %{}
        }
      end)
    })
  end

  def add_project_contributors(context, project, data) do
    champion = Resources.get(context, data.champion)
    reviewer = Resources.get(context, data.reviewer)
    contribs = Enum.map(data.contributors, fn c -> Resources.get(context, c.person) end)

    contribs
    |> Enum.filter(fn c -> c.id != champion.id && c.id != reviewer.id end)
    |> Enum.each(fn c ->
      {:ok, _} = Operately.Operations.ProjectContributorAddition.run(champion, %{
        person_id: c.id,
        project_id: project.id,
        permissions: 70,
        responsibility: "Build and Launch the Website",
        role: :contributor
      })
    end)
  end

end
