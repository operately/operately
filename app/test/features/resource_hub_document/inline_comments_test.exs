defmodule Operately.Features.ResourceHubDocument.InlineCommentsTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.ResourceHubDocument.InlineCommentsSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "review a selected passage and reopen its thread link", ctx do
    ctx
    |> Steps.visit_document()
    |> Steps.select_passage()
    |> Steps.post_thread()
    |> Steps.reply()
    |> Steps.resolve_and_reopen()
    |> Steps.follow_thread_link()
  end

  feature "email links open the message in an open thread on desktop", ctx do
    ctx
    |> Steps.setup_email_link(false)
    |> Steps.follow_email_link(1440)
  end
end
