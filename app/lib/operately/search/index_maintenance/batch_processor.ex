defmodule Operately.Search.IndexMaintenance.BatchProcessor do
  @moduledoc """
  Routes a maintenance batch to the scan for its current phase.

  A source scan reads original Operately records and synchronizes their search
  entries. An index scan reads existing search entries and removes entries whose
  original records are missing or no longer searchable.
  """

  alias Operately.Search.IndexMaintenance.{IndexScan, SourceScan}

  def run(%{phase: :source_scan} = run, source_adapter, batch_size) do
    SourceScan.run(run, source_adapter, batch_size)
  end

  def run(%{phase: :index_scan} = run, source_adapter, batch_size) do
    IndexScan.run(run, source_adapter, batch_size)
  end
end
