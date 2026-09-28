defmodule Operately.Features.ResourceHubDocument.PublicSharingTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ResourceHubDocument.PublicSharingSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "an editor shares a document with an anonymous reader and revokes the link", ctx do
    ctx
    |> Steps.enable_sharing()
    |> Steps.read_anonymously()
    |> Steps.disable_sharing()
    |> Steps.assert_link_unavailable()
  end
end
