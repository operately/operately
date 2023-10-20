defmodule Operately.Activities.Activity do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "activities" do
    belongs_to :author, Operately.People.Person

    field :action, :string
    field :content, :map

    field :resource_id, :binary_id
    field :resource_type, :string

    timestamps()
  end

  def changeset(attrs) do
    changeset(%__MODULE__{}, attrs)
  end

  def changeset(activity, attrs) do
    activity |> cast(attrs, [:author_id, :action, :content])
  end
end
