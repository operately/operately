defmodule Operately.Activities.Content.ProjectTimelineEdited do
  use Operately.Activities.Content

  defmodule MilestoneEdit do
    use Operately.Activities.Content

    embedded_schema do
      field :milestone_id, :string
      field :old_due_date, :utc_datetime
      field :new_due_date, :utc_datetime
    end
  end

  defmodule NewMilestones do
    use Operately.Activities.Content

    embedded_schema do
      field :milestone_id, :string
      field :due_date, :utc_datetime
    end
  end

  embedded_schema do
    field :company_id, :string
    field :project_id, :string

    field :old_start_date, :utc_datetime
    field :old_end_date, :utc_datetime
    field :new_start_date, :utc_datetime
    field :new_end_date, :utc_datetime

    embeds_many :milestone_edits, MilestoneEdit
    embeds_many :new_milestones, NewMilestones
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    project = Operately.Projects.get_project!(params["project_id"])

    changeset(%{
      company_id: project.company_id,
      project_id: project.id,
      old_start_date: params["old_start_date"],
      new_start_date: params["new_start_date"],
      old_end_date: params["old_end_date"],
      new_end_date: params["new_end_date"],
      milestone_edits: params["milestone_edits"],
      new_milestones: params["new_milestones"]
    })
  end
end
