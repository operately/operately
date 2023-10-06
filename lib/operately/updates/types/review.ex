defmodule Operately.Updates.Types.Review do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :survey, :map
    field :review_reason, Ecto.Enum, values: [:phase_change]
    field :previous_phase, :string
    field :new_phase, :string
    field :review_request_id, :id
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:survey, :previous_phase, :new_phase])
  end

  def build(survey, previous_phase, new_phase, review_request_id) do
    %{
      :survey => survey,
      :review_reason => review_reason(review_request_id),
      :previous_phase => previous_phase,
      :new_phase => new_phase,
      :review_request_id => review_request_id
    }
  end

  defp review_reason(review_request_id) do
    if review_request_id do
      :phase_change
    else
      :review_request
    end
  end
end
