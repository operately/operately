defmodule OperatelyWeb.Api.RichContent.Preparation do
  @moduledoc "Shared rich-text input and response preparation for API and MCP transports."

  alias Operately.RichContent.LinkEnrichment

  def prepare_inputs(_conn, inputs), do: LinkEnrichment.restore_source(inputs)

  def prepare_response(conn, payload) do
    # Defensively restore source when viewer context is missing: the payload may
    # already contain titles resolved under another viewer's permissions.
    case {conn.assigns[:current_person], conn.assigns[:current_company]} do
      {nil, _} ->
        LinkEnrichment.restore_source(payload)

      {_, nil} ->
        LinkEnrichment.restore_source(payload)

      {person, company} ->
        LinkEnrichment.enrich(payload, %{person: person, company: company, origin: OperatelyWeb.Endpoint.url()})
    end
  end
end
