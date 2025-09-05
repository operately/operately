defmodule Operately.Activities.Content.ProjectTimelineEdited do
  use Operately.Activities.Content

  defmodule MilestoneUpdate do
    use Operately.Activities.Content

    embedded_schema do
      field :milestone_id, :string

      field :old_title, :string
      field :new_title, :string

      field :old_due_date, :date
      field :new_due_date, :date
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
      field :due_date, :date
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project

    field :old_start_date, :date
    field :new_start_date, :date

    field :old_end_date, :date
    field :new_end_date, :date

    embeds_many :updated_milestones, MilestoneUpdate
    embeds_many :new_milestones, NewMilestones
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id, :space_id, :project_id, :old_start_date, :old_end_date, :new_start_date, :new_end_date])
    |> cast_embed(:updated_milestones)
    |> cast_embed(:new_milestones)
    |> validate_required([:company_id, :space_id, :project_id, :new_start_date])
  end

  def build(params) do
    changeset(params)
  end
end
