defmodule Operately.Demo.Resources do
  def init do
    %{}
  end

  def get(resources, keys) when is_list(keys) do
    Enum.map(keys, fn key -> get(resources, key) end)
  end

  def get(resources, key) do
    case Map.get(resources, key) do
      nil -> raise "Key #{key} not found in resources"
      value -> value
    end
  end

  def add(_, key, {:ok, _}), do: raise "Trying to add {:ok, _} to resources with key #{key}"
  def add(resources, key, value) do
    if Map.has_key?(resources, key) do
      raise "Key #{key} already exists in resources"
    else
      IO.inspect("Adding #{key} to resources")
      Map.put(resources, key, value)
    end
  end

  def create(resources, data, fun) when is_list(data) do
    Enum.reduce(Enum.with_index(data), resources, fn {d, index}, resources ->
      add(resources, d.key, fun.({resources, d, index}))
    end)
  end
end
