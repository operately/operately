defmodule Operately.Demo.Resources do
  def init do
    %{}
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
    Enum.reduce(data, resources, fn d, resources ->
      add(resources, d.key, fun.({resources, d}))
    end)
  end
end
