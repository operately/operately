defmodule TurboConnect.Fields do
  @moduledoc """
  This module provides the `field/2` and `list_of/1` macros to be used for
  defining fields in objects, queries, and mutations.

  The `field/2` macro expects the field_scope to be set before calling it.
  """

  defmacro __using__(_) do
    quote do
      import TurboConnect.Fields

      Module.register_attribute(__MODULE__, :fields, accumulate: true)

      @before_compile unquote(__MODULE__)
    end
  end

  defmacro field(name, type, opts \\ []) do
    quote do
      TurboConnect.Fields.validate_field_scope(@field_scope)
      TurboConnect.Fields.validate_field_opts(unquote(opts))

      @fields {@field_scope, unquote(name), unquote(type), unquote(opts) ++ [optional: false]}
    end
  end

  defmacro field?(name, type, opts \\ []) do
    quote do
      TurboConnect.Fields.validate_field_scope(@field_scope)
      TurboConnect.Fields.validate_field_opts(unquote(opts))

      @fields {@field_scope, unquote(name), unquote(type), unquote(opts) ++ [optional: true]}
    end
  end

  defmacro list_of(type) do
    quote do
      {:list, unquote(type)}
    end
  end

  defmacro __before_compile__(_) do
    quote do
      @fields_as_map TurboConnect.Fields.fields_to_map(@fields)

      def __fields__(), do: @fields_as_map
    end
  end

  #
  # Private Utils
  #

  @doc """
    Converts list of fields to a map grouped by scope.

    Example:

    fields = [
      {:user, :name, :string, []},
      {:user, :age, :integer, []},
      {:user, :hobbies, {:list, :string}, []},
      {:post, :title, :string, []},
      {:post, :content, :string, []}
    ]

    fields_to_map(fields) => %{
      user: %{
        field: [
          {:name, :string, []},
          {:age, :integer, []},
          {:hobbies, {:list, :string}, []}
        ]
      },
      post: %{
        field: [
          {:title, :string, []},
          {:content, :string, []}
        ]
      }
    }
  """
  def fields_to_map(fields) do
    fields
    |> Enum.reverse()
    |> Enum.group_by(&elem(&1, 0), &{elem(&1, 1), elem(&1, 2), elem(&1, 3)})
    |> Enum.map(fn {scope, fields} -> {scope, %{fields: fields}} end)
    |> Enum.into(%{})
  end

  def validate_field_scope(scope) do
    if is_nil(scope) do
      raise "field/2 must be called inside an object, inputs or outputs block"
    end
  end

  def validate_field_opts(opts) do
    valid_opts = [:null]
    invalid_opts = Keyword.keys(opts) -- valid_opts

    if invalid_opts != [] do
      raise "Invalid options for field: #{inspect(opts)}. Valid options are: #{inspect(valid_opts)}"
    end
  end
end
