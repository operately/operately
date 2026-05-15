defmodule Operately.Demo.Projects do
  alias Operately.ContextualDates.{ContextualDate, Timeframe}
  alias Operately.Demo.{Resources, Tasks}
  alias Operately.Projects.Milestone

  def create_projects(resources, data) do
    Resources.create(resources, data, fn {resources, data, _index} ->
      create_project(resources, data)
    end)
  end

  def create_project(resources, data) do
    company = Resources.get(resources, :company)
    owner = Resources.get(resources, :owner)
    champion = Resources.get(resources, data.champion)
    reviewer = data[:reviewer] && Resources.get(resources, data.reviewer)
    space = Resources.get(resources, data.space)
    goal = data[:goal] && Resources.get(resources, data.goal)

    params = %Operately.Operations.ProjectCreation{
      company_id: company.id,
      name: data.name,
      champion_id: champion.id,
      reviewer_id: reviewer && reviewer.id,
      creator_id: owner.id,
      creator_role: "contributor",
      visibility: "everyone",
      group_id: space.id,
      goal_id: goal && goal.id,
      anonymous_access_level: 0,
      company_access_level: 70,
      space_access_level: 70
    }

    {:ok, project} = Operately.Operations.ProjectCreation.run(params)
    {:ok, project} = set_description(project, data[:description])
    {:ok, project} = set_project_timeline(champion, project, data)

    {:ok, _} = create_project_milestones(resources, champion, project, data)
    {:ok, _} = create_project_check_ins(champion, project, data)

    add_project_contributors(resources, project, data)

    project
  end

  def set_description(project, value) do
    Operately.Projects.update_project(project, %{description: Operately.Demo.RichText.from_string(value || "")})
  end

  def set_project_timeline(champion, project, data \\ %{}) do
    today = Date.utc_today()
    start = data[:start_offset_days] && Date.add(today, data.start_offset_days)
    deadline = data[:due_in_days] && Date.add(today, data.due_in_days)

    start = start || (today |> Date.add(:rand.uniform(20)) |> Date.add(-:rand.uniform(20)))
    deadline = deadline || Date.add(start, 10 + :rand.uniform(20))

    Operately.Projects.EditTimelineOperation.run(champion, project, %{
      project_start_date: ContextualDate.create_day_date(start),
      project_due_date: ContextualDate.create_day_date(deadline),
      milestone_updates: [],
      new_milestones: []
    })
  end

  def create_project_check_ins(champion, project, data) do
    check_ins =
      case data[:check_ins] do
        nil -> List.wrap(data[:check_in])
        check_ins -> check_ins
      end

    case check_ins do
      [] -> create_project_check_in(champion, project, nil)
      check_ins ->
        Enum.reduce_while(check_ins, {:ok, project}, fn check_in, {:ok, current_project} ->
          case create_project_check_in(champion, current_project, check_in) do
            {:ok, _check_in} ->
              {:cont, {:ok, Operately.Repo.reload(current_project)}}

            {:error, _} = error ->
              {:halt, error}
          end
        end)
    end
  end

  def create_project_check_in(_champion, project, nil) do
    Operately.Projects.update_project(project, %{next_check_in_scheduled_at: yesterday()})
  end

  def create_project_check_in(champion, project, data) do
    with {:ok, check_in} <-
           Operately.Operations.ProjectCheckIn.run(
             champion,
             project,
             Map.merge(
               %{
                 content: Operately.Demo.RichText.from_string(data.content),
                 status: normalize_status(data[:status])
               },
               %{
                 subscription_parent_type: :project_check_in,
                 subscriber_ids: []
               }
             )
           ) do
      backdate_check_in(check_in, data)
    end
  end

  defp normalize_status(nil), do: :on_track
  defp normalize_status(status) when status in [:on_track, :caution, :off_track], do: status

  defp normalize_status(status) when status in ["on_track", "caution", "off_track"] do
    String.to_existing_atom(status)
  end

  defp backdate_check_in(check_in, data) do
    case data[:days_ago] do
      nil ->
        {:ok, check_in}

      days_ago ->
        timestamp =
          Date.utc_today()
          |> Date.add(-days_ago)
          |> NaiveDateTime.new!(~T[09:00:00])

        check_in
        |> Ecto.Changeset.change(inserted_at: timestamp, updated_at: timestamp)
        |> Operately.Repo.update()
    end
  end

  def yesterday do
    Date.utc_today() |> Date.add(-1) |> DateTime.new!(~T[00:00:00], "Etc/UTC")
  end

  def create_project_milestones(resources, champion, project, data) do
    milestones = data.milestones
    {start_date, due_date} = project_timeframe(project)
    milestones_with_dates = Enum.zip(milestones, build_milestone_due_dates(start_date, due_date, milestones))

    {:ok, _} =
      Operately.Projects.EditTimelineOperation.run(champion, project, %{
        project_start_date: ContextualDate.create_day_date(start_date),
        project_due_date: ContextualDate.create_day_date(due_date),
        milestone_updates: [],
        new_milestones:
          Enum.map(milestones_with_dates, fn {milestone, milestone_due_date} ->
            %{
              title: milestone.title,
              due_date: ContextualDate.create_day_date(milestone_due_date),
              description: Operately.Demo.RichText.from_string(""),
              tasks_kanban_state: %{}
            }
          end)
      })

    milestones_with_dates
    |> Enum.each(fn {milestone_data, milestone_due_date} ->
      {:ok, milestone} = Milestone.get(:system, project_id: project.id, title: milestone_data.title)
      {:ok, _} = Milestone.set_status(milestone, milestone_data.status)
      create_milestone_tasks(resources, champion, project, milestone, milestone_data, milestone_due_date)
    end)

    {:ok, project}
  end

  defp create_milestone_tasks(resources, champion, project, milestone, milestone_data, milestone_due_date) do
    milestone_data
    |> Map.get(:tasks, [])
    |> Enum.each(fn task ->
      status = Tasks.resolve_task_status(project, task[:status])
      assignee = Tasks.resolve_assignee(resources, task[:assignee])
      due_date = milestone_task_due_date(milestone_due_date, task[:due_offset_days])
      due_date = Tasks.normalize_due_date(due_date, status)

      Tasks.create_task(resources, %{
        name: task.name,
        description: task[:description],
        creator_id: champion.id,
        milestone_id: milestone.id,
        project_id: project.id,
        due_date: Tasks.build_due_date(due_date),
        task_status: status,
        status: status.value,
        priority: task[:priority],
        size: task[:size],
        comments: task[:comments]
      }, assignee && assignee.id)
    end)
  end

  defp project_timeframe(project) do
    start_date = Timeframe.start_date(project.timeframe) || Date.utc_today()
    end_date = Timeframe.end_date(project.timeframe) || Date.add(start_date, 30)

    {start_date, end_date}
  end

  defp build_milestone_due_dates(start_date, due_date, milestones) do
    count = max(length(milestones), 1)
    range_days = max(Date.diff(due_date, start_date), 1)
    step = max(div(range_days, count), 1)

    milestones
    |> Enum.with_index()
    |> Enum.map(fn {_milestone, index} ->
      Date.add(start_date, step * (index + 1))
    end)
  end

  defp milestone_task_due_date(nil, _offset_days), do: nil
  defp milestone_task_due_date(_due_date, nil), do: nil
  defp milestone_task_due_date(due_date, offset_days), do: Date.add(due_date, offset_days)

  def add_project_contributors(context, project, data) do
    champion = Resources.get(context, data.champion)

    champion_id = champion.id
    reviewer_id = data[:reviewer] && Resources.get(context, data.reviewer).id

    contribs =
      Enum.map(data.contributors, fn c ->
        {Resources.get(context, c.person), c[:responsibility] || "Contributor"}
      end)

    contribs
    |> Enum.filter(fn {person, _responsibility} -> person.id != champion_id && person.id != reviewer_id end)
    |> Enum.each(fn {person, responsibility} ->
      {:ok, _} =
        Operately.Operations.ProjectContributorAddition.run(champion, %{
          person_id: person.id,
          project_id: project.id,
          permissions: 70,
          responsibility: responsibility,
          role: :contributor
        })
    end)
  end
end
