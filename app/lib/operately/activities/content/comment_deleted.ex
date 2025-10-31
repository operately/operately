defmodule Operately.Activities.Content.CommentDeleted do
  use Operately.Activities.Content

  embedded_schema do
    belongs_to(:company, Operately.Companies.Company)
    belongs_to(:comment, Operately.Updates.Comment)

    field :parent_type, Ecto.Enum, values: Ecto.Enum.values(Operately.Updates.Comment, :entity_type)
    field :parent_id, Ecto.UUID
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :comment_id, :parent_type, :parent_id])
  end

  def build(params) do
    changeset(params)
  end
end
