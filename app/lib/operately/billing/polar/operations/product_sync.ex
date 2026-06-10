defmodule Operately.Billing.Polar.Operations.ProductSync do
  alias Operately.Billing
  alias Operately.Billing.Polar.ProductMapper

  @doc """
  Syncs Operately-managed Polar products into the local billing catalog.
  """
  def run(opts \\ []) do
    client = Billing.provider_client(opts)

    do_run(client, nil, 0)
  end

  defp do_run(client, cursor, synced_count) do
    case client.list_products(cursor: cursor) do
      {:ok, %{items: items, next_cursor: next_cursor}} ->
        with {:ok, synced_count} <- sync_products(items, synced_count) do
          if next_cursor do
            do_run(client, next_cursor, synced_count)
          else
            {:ok, synced_count}
          end
        end

      {:error, _reason} = error ->
        error
    end
  end

  defp sync_products(items, synced_count) do
    Enum.reduce_while(items, {:ok, synced_count}, fn item, {:ok, count} ->
      case ProductMapper.normalize_provider_product(item) do
        {:ok, normalized} ->
          case Billing.upsert_product_from_provider(normalized.product_attrs) do
            {:ok, _product} -> {:cont, {:ok, count + 1}}
            {:error, reason} -> {:halt, {:error, reason}}
          end

        :ignore ->
          {:cont, {:ok, count}}
      end
    end)
  end
end
