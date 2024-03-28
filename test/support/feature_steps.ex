defmodule Operately.FeatureSteps do

  defmacro step(name, ctx, do: block) do
    quote do
      def unquote(name)(unquote(ctx)) do
        IO.write("\n    #{unquote(name)}")

        unquote(block)
      end
    end
  end

  defmacro step(name, ctx, params, do: block) do
    quote do
      def unquote(name)(unquote(ctx), unquote(params)) do
        IO.write("\n    #{unquote(name)}")

        unquote(block)
      end
    end
  end

end
