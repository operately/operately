defmodule Operately.Search.Sources.ResourceHub.Link do
  @behaviour Operately.Search.Source

  alias Operately.ResourceHubs.Link, as: ResourceLink
  alias Operately.RichContent
  alias Operately.Search.Sources.ResourceHub.{Loader, Record}

  @impl true
  def source_type, do: "resource_hub_link"

  @impl true
  def fetch_batch(cursor, limit), do: Loader.fetch_batch(ResourceLink, cursor, limit)

  @impl true
  def fetch_by_ids(ids), do: Loader.fetch_by_ids(ResourceLink, ids)

  @impl true
  def to_entry(record) do
    Record.build(record, record.resource.name, RichContent.to_plain_text(record.resource.description), "description")
  end
end
