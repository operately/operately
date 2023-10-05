defmodule Operately.Updates.Types.Review do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key false
  embedded_schema do
    field :survey, :map
    field :review_reason, Ecto.Enum, values: [:phase_change]
    field :previous_phase, :string
    field :new_phase, :string
  end

  def changeset(attrs) do
    %__MODULE__{}
    |> cast(attrs, __schema__(:fields))
    |> validate_required([:survey, :previous_phase, :new_phase])
  end

  def build(survey, previous_phase, new_phase) do
    %{
      :survey => survey,
      :review_reason => :phase_change,
      :previous_phase => previous_phase,
      :new_phase => new_phase,
    }
  end
end
