defmodule Operately.Activities.Content.ProjectCheckInCommented do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :project, Operately.Projects.Project
    belongs_to :check_in, Operately.Projects.CheckIn
    belongs_to :comment, Operately.Updates.Comment
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
