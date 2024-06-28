defmodule Operately.Access.Group do
  use Operately.Schema

  schema "access_groups" do
    belongs_to :person, Operately.People.Person, foreign_key: :person_id
    belongs_to :company, Operately.Companies.Company, foreign_key: :company_id

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(group, attrs) do
    group
    |> cast(attrs, [:person_id, :company_id])
    |> validate_required([])
  end
end
