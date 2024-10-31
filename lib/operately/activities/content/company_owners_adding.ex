defmodule Operately.Activities.Content.CompanyOwnersAdding do
  use Operately.Activities.Content

  defmodule Owner do
    use Operately.Activities.Content

    embedded_schema do
      belongs_to :id, Operately.People.Person
    end

    def changeset(update, attrs) do
      update
      |> cast(attrs, __schema__(:fields))
      |> validate_required(__schema__(:fields))
    end
  end

  embedded_schema do
    field :company_id, :string
    embeds_many :owners, Owner
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, [:company_id])
    |> cast_embed(:owners)
    |> validate_required([:company_id])
  end

  def build(params) do
    changeset(params)
  end
end
