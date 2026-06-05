defmodule Operately.Support.Features.DiscussionsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.DiscussionsSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
