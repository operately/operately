defmodule OperatelyWeb.Api.Documents.GetPublic do
  use TurboConnect.Query
  alias Operately.ResourceHubs.PublicDocument
  alias OperatelyWeb.Api.Serializer

  inputs do
    field :token, :string, null: false
  end

  outputs do
    field :document, :public_document, null: false
  end

  def call(_conn, inputs) do
    case PublicDocument.get(inputs.token) do
      {:ok, document} -> {:ok, %{document: Serializer.serialize(document)}}
      {:error, :not_found} -> {:error, :not_found}
    end
  end
end
