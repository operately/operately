defmodule Operately.Activities.Content.ProjectContributorAddition do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :project_id, :string
    field :person_id, :string
    field :contributor_id, :string
    field :responsibility, :string
    field :role, :string
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
