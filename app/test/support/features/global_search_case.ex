defmodule Operately.Support.Features.GlobalSearchCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.GlobalSearchSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
