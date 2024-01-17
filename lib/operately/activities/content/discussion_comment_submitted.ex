defmodule Operately.Activities.Content.DiscussionCommentSubmitted do
  use Operately.Activities.Content

  embedded_schema do
    field :company_id, :binary_id
    field :space_id, :binary_id
    field :discussion_id, :binary_id
    field :comment_id, :binary_id
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required(__schema__(:fields))
  end

  def build(params) do
    changeset(params)
  end
end
