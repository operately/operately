defmodule Operately.Updates.Types.StatusUpdate do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :message, :map
    field :old_health, :string
    field :new_health, :string

    field :next_milestone_id, :id
    field :next_milestone_title, :string
    field :next_milestone_due_date, :utc_datetime
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:message, :old_health, :new_health])
  end

  def build(project, new_health, message) do
    Map.merge(
      build_milestone_info(project),
      build_health_info(project, new_health),
      %{:message => message}
    )
  end

  defp build_milestone_info(project) do
    next_milestone = Operately.Projects.get_next_milestone(project)

    if next_milestone do
      %{
        :next_milestone_id => next_milestone.id,
        :next_milestone_title => next_milestone.title,
        :next_milestone_due_date => next_milestone.deadline,
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

end
