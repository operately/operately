defmodule Operately.Projects.ReviewRequest do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_review_requests" do
    belongs_to :project, Operately.Projects.Project
    belongs_to :author, Operately.People.Person
    belongs_to :update, Operately.Updates.Update

    field :content, :map
    field :status, Ecto.Enum, values: [:pending, :completed, :withdrawn], default: :pending

    timestamps()
  end

  @doc false
  def changeset(review_request, attrs) do
    review_request
    |> cast(attrs, [:content, :project_id, :author_id, :update_id, :status])
    |> validate_required([:content, :project_id, :author_id])
  end
end
