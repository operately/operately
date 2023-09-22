defmodule Operately.Updates.Comment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "comments" do
    belongs_to :author, Operately.People.Person

    field :parent_id, :binary_id
    field :parent_type, :string
    field :content, :map

    timestamps()
  end

  @doc false
  def changeset(comment, attrs) do
    comment
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:content, :author_id, :parent_id, :parent_type])
  end
end
