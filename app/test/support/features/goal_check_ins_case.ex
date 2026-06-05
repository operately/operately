defmodule Operately.Support.Features.GoalCheckInsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.GoalCheckInsSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
