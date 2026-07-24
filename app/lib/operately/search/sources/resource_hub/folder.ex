defmodule Operately.Search.Sources.ResourceHub.Folder do
  @behaviour Operately.Search.Source

  alias Operately.ResourceHubs.Folder, as: ResourceFolder
  alias Operately.Search.Sources.ResourceHub.{Loader, Record}

  @impl true
  def source_type, do: "resource_hub_folder"

  @impl true
  def fetch_batch(cursor, limit), do: Loader.fetch_batch(ResourceFolder, cursor, limit)

  @impl true
  def fetch_by_ids(ids), do: Loader.fetch_by_ids(ResourceFolder, ids)

  @impl true
  def to_entry(record), do: Record.build(record, record.resource.name, "", nil)
end
