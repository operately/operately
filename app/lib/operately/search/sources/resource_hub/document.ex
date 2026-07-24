defmodule Operately.Search.Sources.ResourceHub.Document do
  @behaviour Operately.Search.Source

  alias Operately.ResourceHubs.Document, as: ResourceDocument
  alias Operately.RichContent
  alias Operately.Search.Sources.ResourceHub.{Loader, Record}

  @impl true
  def source_type, do: "resource_hub_document"

  @impl true
  def fetch_batch(cursor, limit), do: Loader.fetch_batch(ResourceDocument, cursor, limit)

  @impl true
  def fetch_by_ids(ids), do: Loader.fetch_by_ids(ResourceDocument, ids)

  @impl true
  def to_entry(%{resource: %{state: :draft}}), do: :skip

  def to_entry(record) do
    Record.build(record, record.resource.name, RichContent.to_plain_text(record.resource.content), "content")
  end
end
