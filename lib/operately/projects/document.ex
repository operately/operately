defmodule Operately.Projects.Document do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_documents" do
    field :content, :map
    field :title, :string

    timestamps()
  end

  @doc false
  def changeset(document, attrs) do
    document
    |> cast(attrs, [:title, :content])
    |> validate_required([:title, :content])
  end
end
