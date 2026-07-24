defmodule Operately.Search.Sources.ResourceHub.File do
  @behaviour Operately.Search.Source

  alias Operately.ResourceHubs.File, as: ResourceFile
  alias Operately.RichContent
  alias Operately.Search.Sources.ResourceHub.{Loader, Record}

  @impl true
  def source_type, do: "resource_hub_file"

  @impl true
  def fetch_batch(cursor, limit), do: Loader.fetch_batch(ResourceFile, cursor, limit)

  @impl true
  def fetch_by_ids(ids), do: Loader.fetch_by_ids(ResourceFile, ids)

  @impl true
  def to_entry(record) do
    Record.build(record, record.resource.name, RichContent.to_plain_text(record.resource.description), "description")
  end
end
