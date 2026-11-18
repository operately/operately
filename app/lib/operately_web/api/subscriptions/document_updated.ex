defmodule OperatelyWeb.Api.Subscriptions.DocumentUpdated do
  use TurboConnect.Subscription

  alias Operately.ResourceHubs.Document
  alias OperatelyWeb.Api.Helpers

  def join(_name, %{"documentId" => id}, %{assigns: %{person: person, company: company}} = socket) when is_binary(id) do
    with true <- person.company_id == company.id,
         {:ok, id} when not is_nil(id) <- Helpers.decode_id(id),
         {:ok, document} <- Document.get(person, id: id) do
      {:ok, socket, [document.id]}
    else
      _ -> {:error, %{reason: "unauthorized"}}
    end
  end

  def join(_, _, _), do: {:error, %{reason: "unauthorized"}}

  # Nested writers leave publication to the operation owning the transaction.
  def broadcast_result({:ok, _} = result, document_id) do
    unless Operately.Repo.in_transaction?() do
      OperatelyWeb.ApiSocket.broadcast!("api:document_updated:#{document_id}")
    end

    result
  end

  def broadcast_result(result, _document_id), do: result
end
