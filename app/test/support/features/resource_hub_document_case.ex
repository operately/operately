defmodule Operately.Support.Features.ResourceHubDocumentCase do
  defmacro __using__(_) do
    quote do
      use Operately.Support.ResourceHub.Deletion
      use Operately.Support.ResourceHub.Comments
      use Operately.Support.ResourceHub.Moving

      alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

      setup ctx, do: Steps.setup(ctx)
    end
  end
end
