defmodule Operately.Projects.KeyResource do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_key_resources" do
    belongs_to :project, Operately.Projects.Project, foreign_key: :project_id

    field :link, :string
    field :title, :string
    field :type, Ecto.Enum, values: [:github, :generic]

    timestamps()
  end

  @doc false
  def changeset(key_resource, attrs) do
    key_resource
    |> cast(attrs, [:title, :link, :type, :project_id])
    |> validate_required([:title, :link, :type, :project_id])
  end
end
