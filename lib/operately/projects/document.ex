defmodule Operately.Projects.Document do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_documents" do
    belongs_to :author, Operately.People.Person

    field :content, :map
    field :title, :string

    timestamps()
  end

  @doc false
  def changeset(document, attrs) do
    document
    |> cast(attrs, [:title, :content, :author_id])
    |> validate_required([:title, :content, :author_id])
  end
end
