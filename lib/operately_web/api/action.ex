defmodule OperatelyWeb.Api.Action do
  def new(), do: {:ok, %{}}

  def run(action, key, f) do
    if duplicate_key?(action, key) do
      raise_no_duplicate_keys(key)
    else
      res = run_action(action, f) 
      process_result(res, action, key)
    end
  end

  defp run_action(_action = {:ok, _ctx}, f) when is_function(f, 0), do: f.()
  defp run_action(action = {:ok, ctx}, f) when is_function(f, 1), do: f.(ctx)
  defp run_action(action = {:error, _, _}, _), do: action

  defp process_result(res, action, key) do
    cond do
      is_res_ok?(res) -> {:ok, Map.put(action, key, Tuple.delete_at(res, 0))}
      is_res_error?(res) -> {:error, key, Tuple.delete_at(res, 0)}
      true -> raise_bad_result(res)
    end
  end

  defp duplicate_key?({:ok, ctx}, key) do
    Map.has_key?(ctx, key)
  end

  defp duplicate_key?(_, _), do: false

  defp is_res_ok?(res) do
    is_tuple(res) && elem(res, 0) == :ok
  end

  defp is_res_error?(res) do
    is_tuple(res) && elem(res, 0) == :error
  end

  defp raise_no_duplicate_keys(key) do
    raise ArgumentError, "Action already has key #{inspect(key)}. No duplicate keys allowed."
  end

  defp raise_bad_result(res) do
    raise ArgumentError, "Unknown result #{inspect(res)} from action, expected {:ok, ...} or {:error, ...}"
  end
end
