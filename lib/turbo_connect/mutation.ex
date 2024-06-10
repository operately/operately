defmodule TurboConnect.Mutation do
  defmacro __using__(_) do
    quote do
      use TurboConnect.Fields

      import TurboConnect.Mutation
      @before_compile unquote(__MODULE__)
    end
  end

  defmacro inputs(do: block) do
    quote do
      @field_scope :inputs
      unquote(block)
      @field_scope nil
    end
  end

  defmacro outputs(do: block) do
    quote do
      @field_scope :outputs
      unquote(block)
      @field_scope nil
    end
  end

  defmacro __before_compile__(_) do
    quote do
      def __inputs__(), do: __fields__()[:inputs]
      def __outputs__(), do: __fields__()[:outputs]
    end
  end
end
