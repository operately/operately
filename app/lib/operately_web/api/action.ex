defmodule OperatelyWeb.Api.Action do
  def new(), do: {:ok, %{}}

  def run({:ok, ctx}, key, f) do
    if Map.has_key?(ctx, key) do
      raise_no_duplicate_keys(key)
    else
      run_action(f, ctx) |> process_result(ctx, key)
    end
  end

  def run(err, _key, _f), do: err

  # Helpers

  defp run_action(f, _ctx) when is_function(f, 0), do: f.()
  defp run_action(f, ctx) when is_function(f, 1), do: f.(ctx)

  defp process_result(res, ctx, key) do
    case res do
      {:ok, res} -> {:ok, Map.put(ctx, key, res)}
      {:error, e} -> {:error, key, %{error: e, context: ctx}}
      _ -> raise_bad_result(res)
    end
  end

  defp raise_no_duplicate_keys(key) do
    raise ArgumentError, "Action already has key #{inspect(key)}. No duplicate keys allowed."
  end

  defp raise_bad_result(res) do
    raise ArgumentError, "Unknown result #{inspect(res)} from action, expected {:ok, ...} or {:error, ...}"
  end
end
