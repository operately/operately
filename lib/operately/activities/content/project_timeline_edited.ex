defmodule Operately.Activities.Content.ProjectTimelineEdited do
  use Operately.Activities.Content

  defmodule MilestoneUpdate do
    use Operately.Activities.Content

    embedded_schema do
      field :milestone_id, :string

      field :old_title, :string
      field :new_title, :string

      field :old_due_date, :utc_datetime
      field :new_due_date, :utc_datetime
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  defmodule NewMilestones do
    use Operately.Activities.Content

    embedded_schema do
      field :milestone_id, :string
      field :title, :string
      field :due_date, :utc_datetime
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project

    field :old_start_date, :utc_datetime
    field :new_start_date, :utc_datetime

    field :old_end_date, :utc_datetime
    field :new_end_date, :utc_datetime

    embeds_many :milestone_updates, MilestoneUpdate
    embeds_many :new_milestones, NewMilestones
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :project_id, :old_start_date, :old_end_date, :new_start_date, :new_end_date])
    |> cast_embed(:milestone_updates)
    |> cast_embed(:new_milestones)
    |> validate_required([:company_id, :project_id, :new_start_date, :new_end_date])
  end

  def build(params) do
    changeset(params)
  end
end
