defmodule Operately.Support.Features.GoalCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.GoalSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
