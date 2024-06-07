defmodule TurboConnect.Types do

  defmacro __using__(_) do
    quote do
      use TurboConnect.Fields

      import TurboConnect.Types
      Module.register_attribute(__MODULE__, :unions, accumulate: true)
      @before_compile unquote(__MODULE__)
    end
  end

  defmacro object(name, do: block) do
    quote do
      @field_scope unquote(name)
      unquote(block)
      @field_scope nil
    end
  end

  defmacro union(name, types: types) do
    quote do
      @unions {unquote(name), unquote(types)}
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def __objects__(), do: __fields__()
      def __unions__(), do: Enum.reverse(@unions) |> Enum.into(%{})
    end
  end
end
