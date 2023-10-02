defmodule Operately.Projects.ReviewRequest do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "project_review_requests" do
    field :content, :map
    field :project_id, :binary_id
    field :author_id, :binary_id

    timestamps()
  end

  @doc false
  def changeset(review_request, attrs) do
    review_request
    |> cast(attrs, [:content])
    |> validate_required([:content])
  end
end
