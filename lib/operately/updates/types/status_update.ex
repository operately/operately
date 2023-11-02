defmodule Operately.Updates.Types.StatusUpdate do
  use Ecto.Schema
  import Ecto.Changeset

  defmodule Health do
    use Ecto.Schema
    import Ecto.Changeset

    @primary_key false
    embedded_schema do
      field :status, :string
      field :schedule, :string
      field :budget, :string
      field :team, :string
      field :risk, :string
    end

    def changeset(health, attrs) do
      health
      |> cast(attrs, [:status, :schedule, :budget, :team, :risk])
    end
  end

  @primary_key false
  embedded_schema do
    field :message, :map

    embeds_one :health, Health

    field :old_health, :string
    field :new_health, :string

    field :next_milestone_id, Ecto.UUID
    field :next_milestone_title, :string
    field :next_milestone_due_date, :utc_datetime

    field :phase, :string
    field :phase_start, :utc_datetime
    field :phase_end, :utc_datetime

    field :project_start_time, :utc_datetime
    field :project_end_time, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:message, :old_health, :new_health, :next_milestone_id, :next_milestone_title, :next_milestone_due_date, :phase, :phase_start, :phase_end, :project_start_time, :project_end_time])
    |> cast_embed(:health)
    |> validate_required([:message, :old_health, :new_health])
  end

  def build(project, health, message) do
    result = %{}
    result = Map.merge(result, build_project_info(project))
    result = Map.merge(result, build_health_info(project, health["status"]))
    result = Map.merge(result, build_milestone_info(project))
    result = Map.merge(result, build_phase_info(project))
    result = Map.merge(result, %{:message => message})
    result = Map.merge(result, %{:health => health})
    result
  end

  defp build_milestone_info(project) do
    next_milestone = Operately.Projects.get_next_milestone(project)

    if next_milestone do
      %{
        :next_milestone_id => next_milestone.id,
        :next_milestone_title => next_milestone.title,
        :next_milestone_due_date => next_milestone.deadline_at
      }
    else
      %{}
    end
  end

  defp build_health_info(project, new_health) do
    previous_health = Atom.to_string(project.health)

    %{
      :old_health => previous_health,
      :new_health => new_health,
    }
  end

  defp build_phase_info(project) do
    phase_history = 
      project
      |> Operately.Projects.list_project_phase_history()
      |> Enum.sort_by(& &1.inserted_at)

    current_phase = Enum.at(phase_history, -1)

    if current_phase do
      %{
        :phase => Atom.to_string(current_phase.phase),
        :phase_start => current_phase.start_time,
        :phase_end => current_phase.end_time,
      }
    else
      %{}
    end
  end

  defp build_project_info(project) do
    %{
      :project_start_time => project.started_at,
      :project_end_time => project.deadline,
    }
  end

end
