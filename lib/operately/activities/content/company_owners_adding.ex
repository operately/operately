defmodule Operately.Activities.Content.CompanyOwnersAdding do
  use Operately.Activities.Content

  defmodule Owner do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :person, Operately.People.Person
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    field :company_id, :string
    embeds_many :people, Owner
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
