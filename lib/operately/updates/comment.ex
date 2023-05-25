defmodule Operately.Updates.Comment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "comments" do
    belongs_to :update, Operately.Updates.Update
    belongs_to :author, Operately.Accounts.User

    field :content, :map

    timestamps()
  end

  @doc false
  def changeset(comment, attrs) do
    comment
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:content, :update_id, :author_id])
  end
end
