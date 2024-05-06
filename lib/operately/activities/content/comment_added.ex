defmodule Operately.Activities.Content.CommentAdded do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :string
    field :comment_thread_id, :string
    field :comment_id, :string

    field :project_id, :string
    field :space_id, :string
    field :goal_id, :string
    field :activity_id, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:company_id, :comment_thread_id, :comment_id])
  end

  def build(params) do
    changeset(params)
  end
end
