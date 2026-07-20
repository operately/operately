defmodule Operately.Search.IndexMaintenance.SourceScan do
  @moduledoc """
  Scans original Operately records and synchronizes their search entries.
  """

  alias Operately.Search.Source
  alias Operately.Search.IndexMaintenance.{BatchResult, EntrySynchronizer}

  def run(run, source_adapter, batch_size) do
    with {:ok, source_records} <- source_adapter.fetch_batch(run.cursor, batch_size),
         {:ok, result} <- synchronize(run, source_adapter, source_records) do
      {:ok, BatchResult.with_page(result, last_source_id(source_records), length(source_records), batch_size)}
    end
  end

  defp synchronize(%{kind: :backfill} = run, source_adapter, source_records) do
    EntrySynchronizer.backfill(run.source_type, source_adapter, source_records)
  end

  defp synchronize(%{kind: :reconciliation} = run, source_adapter, source_records) do
    EntrySynchronizer.repair_locked(run.source_type, source_adapter, source_records)
  end

  defp last_source_id([]), do: nil
  defp last_source_id(source_records), do: source_records |> List.last() |> Source.id!()
end
