defmodule Operately.Support.Features.ProjectsCase do
  defmacro __using__(_) do
    quote do
      alias Operately.Support.Features.ProjectSteps, as: Steps
      alias Operately.Support.Features.ReviewSteps
    end
  end
end
