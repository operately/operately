defmodule Operately.CuratedTemplates.PreviewData.KpiEntry do
  use Ecto.Schema
  alias Operately.CuratedTemplates.Definitions
  @primary_key false

  embedded_schema do
    field :date, :date
    field :value, :float
  end

  def changeset(schema, attrs) do
    Definitions.cast_fields(schema, attrs, [:date, :value], [:date, :value], :published)
  end
end
