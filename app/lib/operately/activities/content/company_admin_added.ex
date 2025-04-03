defmodule Operately.Activities.Content.CompanyAdminAdded do
  use Operately.Activities.Content

  defmodule Person do
    use Operately.Activities.Content

    embedded_schema do
      field :id, :string
      field :full_name, :string
      field :email, :string
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    belongs_to :company, Operately.Companies.Company
    embeds_many :people, Person
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id])
    |> cast_embed(:people)
    |> validate_required([:company_id])
  end

  def build(params) do
    changeset(params)
  end
end
