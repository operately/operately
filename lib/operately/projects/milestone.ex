defmodule Operately.Projects.Milestone do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_milestones" do
    field :deadline_at, :naive_datetime
    field :title, :string
    field :project_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(milestone, attrs) do
    milestone
    |> cast(attrs, [:title, :deadline_at])
    |> validate_required([:title, :deadline_at])
  end
end
