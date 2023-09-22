defmodule Operately.Projects.ProjectMilestoneComment do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_milestone_comments" do
    field :content, :map
    field :author_id, :binary_id
    field :milestone_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(project_milestone_comment, attrs) do
    project_milestone_comment
    |> cast(attrs, [:content])
    |> validate_required([:content])
  end
end
