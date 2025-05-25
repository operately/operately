defmodule Operately.FeatureSteps do
  defmacro step(name, do: block) do
    quote do
      def unquote(name)() do
        IO.write("    #{unquote(name)}\n")

        unquote(block)
      end
    end
  end

  defmacro step(name, ctx, do: block) do
    quote do
      def unquote(name)(unquote(ctx)) do
        IO.write("    #{unquote(name)}\n")

        unquote(block)
      end
    end
  end

  defmacro step(name, ctx, params, do: block) do
    quote do
      def unquote(name)(unquote(ctx), unquote(params)) do
        IO.write("    #{unquote(name)}\n")

        unquote(block)
      end
    end
  end
end
