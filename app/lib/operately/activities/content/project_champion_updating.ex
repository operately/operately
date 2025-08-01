defmodule Operately.Activities.Content.ProjectChampionUpdating do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :space, Operately.Groups.Group
    belongs_to :project, Operately.Projects.Project
    belongs_to :old_champion, Operately.People.Person
    belongs_to :new_champion, Operately.People.Person
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields) -- [:old_champion_id, :new_champion_id])
  end

  def build(params) do
    changeset(params)
  end
end
