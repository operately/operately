defmodule Operately.Billing.Polar.Operations.ProductSync do
  alias Operately.Billing
  alias Operately.Billing.PlanDefinition
  alias Operately.Billing.Plans
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
          case ensure_provider_managed_plan_definition(normalized) do
            :ok ->
              case Billing.upsert_product_from_provider(normalized.product_attrs) do
                {:ok, _product} -> {:cont, {:ok, count + 1}}
                {:error, reason} -> {:halt, {:error, reason}}
              end

            :skip ->
              {:cont, {:ok, count}}
          end

        :ignore ->
          {:cont, {:ok, count}}
      end
    end)
  end

  defp ensure_provider_managed_plan_definition(%{product_attrs: %{plan_family: plan_family}, plan_definition_snapshot: snapshot}) do
    case Plans.get(plan_family) do
      %PlanDefinition{billing_behavior: :provider_managed} ->
        :ok

      %PlanDefinition{} ->
        :skip

      nil ->
        create_provider_managed_plan_definition(snapshot)
    end
  end

  defp create_provider_managed_plan_definition({:valid, %{plan_definition_attrs: attrs}}) do
    case Billing.create_plan_definition(attrs) do
      {:ok, _plan_definition} -> :ok
      {:error, _changeset} -> :skip
    end
  end

  defp create_provider_managed_plan_definition(:missing), do: :skip
  defp create_provider_managed_plan_definition({:invalid, _reason}), do: :skip
end
