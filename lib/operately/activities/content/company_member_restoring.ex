defmodule Operately.Activities.Content.CompanyMemberRestoring do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to :person, Operately.People.Person
    belongs_to :company, Operately.Companies.Company
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
