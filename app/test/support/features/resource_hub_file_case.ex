defmodule Operately.Support.Features.ResourceHubFileCase do
  defmacro __using__(_) do
    quote do
      use Operately.Support.ResourceHub.Deletion
      use Operately.Support.ResourceHub.Comments
      use Operately.Support.ResourceHub.Moving

      alias Operately.Support.Features.ResourceHubFileSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
