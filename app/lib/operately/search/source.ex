defmodule Operately.Search.Source do
  @moduledoc """
  Defines the interface for adapters that convert Operately records into search entries.

  Each adapter handles one record type, such as projects or documents. It loads records
  in batches during a backfill, reloads selected records during reconciliation, and
  converts each record into attributes accepted by `Operately.Search.Indexer`.

  Conversion returns `{:ok, attrs}` for a searchable record, `:skip` for a record that
  should not be indexed, or `{:error, reason}` when conversion fails.
  """

  @type cursor :: Ecto.UUID.t() | nil
  @type source :: struct()

  @callback source_type() :: String.t()
  @callback fetch_batch(cursor(), pos_integer()) :: {:ok, [source()]} | {:error, term()}
  @callback fetch_by_ids([Ecto.UUID.t()]) :: {:ok, [source()]} | {:error, term()}
  @callback to_entry(source()) :: {:ok, map()} | :skip | {:error, term()}
end
