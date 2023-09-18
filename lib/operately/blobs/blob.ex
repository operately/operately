defmodule Operately.Blobs.Blob do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "blobs" do
    field :filename, :string
    field :status, Ecto.Enum, values: [:pending, :uploaded, :deleted]
    field :author_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(blob, attrs) do
    blob
    |> cast(attrs, [:filename, :status])
    |> validate_required([:filename, :status])
  end
end
