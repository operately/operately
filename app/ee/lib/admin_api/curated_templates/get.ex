defmodule OperatelyEE.AdminApi.CuratedTemplates.Get do
  use TurboConnect.Query
  alias OperatelyEE.AdminApi.CuratedTemplates.Shared

  inputs do
    field :id, :id, null: false
  end

  outputs do
    field :template, :curated_template
  end

  def call(_conn, inputs) do
    case Shared.load(inputs.id) do
      {:ok, template} -> {:ok, %{template: OperatelyWeb.Api.Serializer.serialize(template, level: :full)}}
      error -> Shared.respond(error)
    end
  end
end
