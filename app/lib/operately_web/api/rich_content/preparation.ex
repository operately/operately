defmodule OperatelyWeb.Api.RichContent.Preparation do
  @moduledoc "Shared rich-text input and response preparation for API and MCP transports."

  alias Operately.RichContent.LinkEnrichment

  def prepare_inputs(conn, inputs) do
    prepare_inputs(conn, inputs, conn.assigns[:turbo_req_handler])
  end

  def prepare_inputs(conn, inputs, handler) do
    source = LinkEnrichment.restore_source(inputs)

    case {conn.assigns[:current_person], conn.assigns[:current_company]} do
      {person, company} when not is_nil(person) and not is_nil(company) ->
        {excluded, content} = Map.split(source, excluded_fields(handler))
        context = %{person: person, company: company, origin: OperatelyWeb.Endpoint.url()}
        Map.merge(LinkEnrichment.prepare_for_save(content, context), excluded)

      _ ->
        source
    end
  end

  defp excluded_fields(nil), do: []

  defp excluded_fields(handler) do
    handler.__inputs__().fields
    |> Enum.filter(fn {_name, _type, opts} -> Keyword.get(opts, :skip_link_enrichment, false) end)
    |> Enum.flat_map(fn {name, _type, _opts} -> [name, Atom.to_string(name)] end)
  end

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
