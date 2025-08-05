defmodule Operately.Goals.Update.Check do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false

  embedded_schema do
    field :id, :string
    field :name, :string
    field :index, :integer
    field :completed, :boolean
  end

  def changeset(target, attrs) do
    target
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end
end
