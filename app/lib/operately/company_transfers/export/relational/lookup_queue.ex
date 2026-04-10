defmodule Operately.CompanyTransfers.Export.Relational.LookupQueue do
  @moduledoc """
  Queue of pending dependency lookups grouped by `{table, column}`.

  Example internal shape:

      %LookupQueue{
        buckets: %{
          "accounts" => %{"id" => ["a1", "a2"]},
          "subscription_lists" => %{"id" => ["s1"]}
        }
      }

  Public API:
  - `new/0` creates an empty queue
  - `enqueue/4` adds one lookup value while keeping buckets deduplicated
  - `next/1` returns the next `%DependencyLookup{}` plus the remaining queue
  - `empty?/1` reports whether there is any work left
  """

  defmodule DependencyLookup do
    @moduledoc """
    One pending dependency-parent lookup, such as "fetch accounts where id in [...]".
    """

    @type t :: %__MODULE__{
            table: String.t(),
            column: String.t(),
            values: [term()]
          }

    defstruct [:table, :column, values: []]
  end

  alias __MODULE__.DependencyLookup

  @type buckets :: %{optional(String.t()) => %{optional(String.t()) => [term()]}}

  @type t :: %__MODULE__{
          buckets: buckets()
        }

  defstruct buckets: %{}

  def new do
    %__MODULE__{}
  end

  def empty?(%__MODULE__{buckets: buckets}) do
    map_size(buckets) == 0
  end

  def enqueue(%__MODULE__{} = queue, _table, _column, nil), do: queue

  def enqueue(%__MODULE__{buckets: buckets} = queue, table, column, value) when is_binary(table) and is_binary(column) do
    # Group queued values by table and lookup column, while keeping values unique.
    buckets =
      update_in(buckets, [Access.key(table, %{}), Access.key(column, [])], fn values ->
        Enum.uniq((values || []) ++ [value])
      end)

    %{queue | buckets: buckets}
  end

  def next(%__MODULE__{} = queue) do
    case pop_bucket(queue.buckets) do
      nil ->
        :empty

      {lookup, buckets} ->
        {lookup, %{queue | buckets: buckets}}
    end
  end

  defp pop_bucket(buckets) do
    Enum.find_value(buckets, fn {table, columns} ->
      Enum.find_value(columns, fn {column, values} ->
        if values == [] do
          nil
        else
          # Return one non-empty lookup bucket and clear it from the queue copy.
          lookup = %DependencyLookup{table: table, column: column, values: values}
          remaining_buckets = buckets |> clear_bucket(table, column) |> compact_table(table)
          {lookup, remaining_buckets}
        end
      end)
    end)
  end

  defp clear_bucket(buckets, table, column) do
    update_in(buckets, [table, column], fn _ -> [] end)
  end

  defp compact_table(buckets, table) do
    # Remove empty column buckets and drop the table entry once it becomes empty.
    case Map.get(buckets, table, %{}) |> Enum.reject(fn {_column, values} -> values == [] end) do
      [] -> Map.delete(buckets, table)
      columns -> Map.put(buckets, table, Map.new(columns))
    end
  end
end
