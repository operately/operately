defmodule Operately.Support.Features.ProjectCheckInsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.ProjectCheckInsSteps, as: Steps

      setup ctx do
        ctx
        |> Steps.given_a_project_exists()
        |> Steps.log_in_as_champion()
      end
    end
  end
end
