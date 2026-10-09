defmodule Operately.CuratedTemplates.Definitions.Goal do
  use Ecto.Schema
  import Ecto.Changeset
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :name, :string
    field :description, :map
    field :duration_days, :integer
    embeds_many :targets, Definitions.Target, on_replace: :delete
  end

  def changeset(schema, attrs, mode) do
    schema
    |> Definitions.cast_fields(attrs, [:name, :description, :duration_days], [:name], mode)
    |> Definitions.description()
    |> Definitions.nonnegative(:duration_days)
    |> cast_embed(:targets, with: &Definitions.Target.changeset(&1, &2, mode))
    |> Definitions.limit_children(:targets)
  end
end
