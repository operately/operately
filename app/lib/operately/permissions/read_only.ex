defmodule Operately.Permissions.ReadOnly do
  def view_only(permissions) do
    Enum.reduce(Map.keys(Map.from_struct(permissions)), permissions, fn
      :can_view, acc -> acc
      key, acc -> Map.put(acc, key, false)
    end)
  end

  def deny_all(permissions) do
    Enum.reduce(Map.keys(Map.from_struct(permissions)), permissions, fn key, acc ->
      Map.put(acc, key, false)
    end)
  end
end
