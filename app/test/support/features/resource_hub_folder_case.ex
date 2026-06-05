defmodule Operately.Support.Features.ResourceHubFolderCase do
  defmacro __using__(_) do
    quote do
      use Operately.Support.ResourceHub.Deletion
      use Operately.Support.ResourceHub.Moving

      alias Operately.Support.Features.ResourceHubFolderSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
