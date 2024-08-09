defmodule Operately.Activities.Content.CompanyAdminAdded do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    belongs_to :person, Operately.People.Person
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :person_id])
  end

  def build(params) do
    changeset(params)
  end
end
