defmodule Operately.Assignments.Loader do
  import Ecto.Query, only: [from: 2]

  alias Operately.Repo
  alias Operately.Goals.{Goal, Update}
  alias Operately.Projects.{Project, CheckIn}

  alias OperatelyWeb.Paths

  defmodule Assignment do
    @enforce_keys [:resource_id, :name, :due, :relative_due, :type, :path]
    defstruct [:resource_id, :name, :due, :relative_due, :type, :path, :url, :author_id, :author_name]
  end

  def load(person, company) do
    [
      Task.async(fn -> load_pending_project_check_ins(company, person) end),
      Task.async(fn -> load_pending_project_check_in_acknowledgements(company, person) end)
      # Task.async(fn -> load_pending_goal_updates(company, person) end),
      # Task.async(fn -> load_pending_goal_update_acknowledgements(company, person) end)
    ]
    |> Task.await_many()
    |> List.flatten()
  end

  def load_pending_project_check_ins(company, person) do
    from(p in Project,
      join: champion in assoc(p, :champion),
      where: p.next_check_in_scheduled_at <= ^DateTime.utc_now(),
      where: p.status == "active",
      where: champion.id == ^person.id,
      where: is_nil(p.deleted_at),
      preload: [champion: champion]
    )
    |> Repo.all()
    |> Enum.map(fn project ->
      %__MODULE__.Assignment{
        resource_id: Paths.project_id(project),
        name: project.name,
        due: Operately.Time.as_datetime(project.next_check_in_scheduled_at),
        relative_due: Operately.Time.relative_due_days(project.next_check_in_scheduled_at),
        type: :project,
        path: Paths.project_check_in_new_path(company, project),
        url: Paths.to_url(Paths.project_check_in_new_path(company, project))
      }
    end)
  end

  defp load_pending_project_check_in_acknowledgements(company, person) do
    from(c in CheckIn,
      join: project in assoc(c, :project),
      join: author in assoc(c, :author),
      left_join: champion in assoc(project, :champion),
      left_join: reviewer in assoc(project, :reviewer),
      where: is_nil(c.acknowledged_by_id),
      where: is_nil(project.deleted_at),
      where: (reviewer.id == ^person.id and author.id != reviewer.id) or (champion.id == ^person.id and author.id != champion.id),
      preload: [project: {project, reviewer: reviewer}, author: author]
    )
    |> Repo.all()
    |> Enum.map(fn check_in ->
      path = Paths.project_check_in_path(company, check_in)

      %Assignment{
        resource_id: Paths.project_check_in_id(check_in),
        name: check_in.project.name,
        due: Operately.Time.as_datetime(check_in.inserted_at),
        relative_due: Operately.Time.relative_due_days(check_in.inserted_at),
        type: :check_in,
        path: path,
        url: Paths.to_url(path),
        author_id: Paths.person_id(check_in.author),
        author_name: check_in.author.full_name
      }
    end)
  end

  # defp load_pending_goal_updates(company, person) do
  #   from(g in Goal,
  #     where: g.next_update_scheduled_at <= ^DateTime.utc_now(),
  #     where: is_nil(g.closed_at),
  #     where: g.champion_id == ^person.id,
  #     where: fragment("(g0.timeframe->'contextual_start_date'->>'date' <= ? OR g0.timeframe->'contextual_start_date'->>'date' IS NULL)", ^to_string(Date.utc_today()))
  #   )
  #   |> Repo.all()
  #   |> Enum.map(fn goal ->
  #     path = Paths.goal_check_in_new_path(company, goal)

  #     %Assignment{
  #       resource_id: Paths.goal_id(goal),
  #       name: goal.name,
  #       due: Operately.Time.as_datetime(goal.next_update_scheduled_at),
  #       relative_due: Operately.Time.relative_due_days(goal.next_update_scheduled_at),
  #       type: :goal,
  #       path: path,
  #       url: Paths.to_url(path)
  #     }
  #   end)
  # end

  # defp load_pending_goal_update_acknowledgements(company, person) do
  #   from(u in Update,
  #     join: goal in assoc(u, :goal),
  #     join: author in assoc(u, :author),
  #     where: is_nil(goal.deleted_at),
  #     where: is_nil(u.acknowledged_by_id),
  #     preload: [goal: goal, author: author]
  #   )
  #   |> Repo.all()
  #   |> Enum.map(fn update ->
  #     path = Paths.goal_check_in_path(company, update)

  #     %Assignment{
  #       resource_id: Paths.goal_update_id(update),
  #       name: update.goal.name,
  #       due: Operately.Time.as_datetime(update.inserted_at),
  #       relative_due: Operately.Time.relative_due_days(update.inserted_at),
  #       type: :goal_update,
  #       path: path,
  #       url: Paths.to_url(path),
  #       author_id: Paths.person_id(update.author),
  #       author_name: update.author.full_name
  #     }
  #   end)
  # end
end
