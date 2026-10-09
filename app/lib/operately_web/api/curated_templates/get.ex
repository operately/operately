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
      template -> {:ok, %{template: Map.put(Serializer.serialize(template), :definition, Jason.encode!(template.definition))}}
    end
  end
end
