defmodule Operately.Search.ErrorCategory do
  @moduledoc """
  Defines the categories of errors that can occur during search index maintenance.
  """

  def sanitize(reason) when is_atom(reason), do: Atom.to_string(reason)
  def sanitize({category, _details}) when is_atom(category), do: Atom.to_string(category)
  def sanitize(%{__struct__: module}) when is_atom(module), do: inspect(module)
  def sanitize(_reason), do: "unknown"
end
