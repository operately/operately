defmodule OperatelyWeb.Api.CuratedTemplates.List do
  use TurboConnect.Query
  alias Operately.CuratedTemplates
  alias OperatelyWeb.Api.Serializer

  inputs do
    field? :type, :curated_template_type
    field? :category, :string
    field? :limit, :integer
    field? :offset, :integer
  end

  outputs do
    field :templates, list_of(:curated_template)
    field :total, :integer
  end

  def call(_conn, inputs) do
    limit = inputs[:limit] || 20
    offset = inputs[:offset] || 0
    category = inputs[:category]

    if limit in 1..100 and offset in 0..1_000_000 and (is_nil(category) or byte_size(category) <= 400) do
      result = CuratedTemplates.list(Map.merge(inputs, %{limit: limit, offset: offset}), :public)
      public_fields = [:__typename, :id, :type, :title, :summary, :category, :content_language, :updated_at]
      templates = result.templates |> Serializer.serialize(level: :essential) |> Enum.map(&Map.take(&1, public_fields))
      {:ok, %{templates: templates, total: result.total}}
    else
      {:error, :bad_request}
    end
  end
end
