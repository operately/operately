defmodule OperatelyEE.AdminApi.CuratedTemplates.Delete do
  use TurboConnect.Mutation
  alias OperatelyEE.AdminApi.CuratedTemplates.Shared

  inputs do
    field :id, :id, null: false
    field :expected_updated_at, :datetime
  end

  outputs do
    field? :template, :curated_template, null: true
    field :errors, list_of(:curated_template_validation_error)
  end

  def call(_conn, inputs) do
    with {:ok, template} <- Shared.load(inputs.id) do
      Operately.CuratedTemplates.delete(template, inputs.expected_updated_at)
    end
    |> Shared.respond()
  end
end
