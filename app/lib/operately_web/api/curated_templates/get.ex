defmodule OperatelyWeb.Api.CuratedTemplates.Get do
  use TurboConnect.Query
  alias Operately.CuratedTemplates
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :template, :curated_template
  end

  def call(_conn, inputs) do
    case CuratedTemplates.get_published(inputs.id) do
      nil -> {:error, :not_found}
      template ->
        serialized = Serializer.serialize(template, level: :full)
        public_fields = [:__typename, :id, :type, :title, :summary, :category, :content_language, :updated_at, :definition]
        {:ok, %{template: Map.take(serialized, public_fields)}}
    end
  end
end
