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

  feature "table selection keeps an inline comment available after closing and reloading", ctx do
    ctx
    |> Steps.given_table_content()
    |> Steps.visit_document()
    |> Steps.capture_browser_errors()
    |> Steps.select_table_passage()
    |> Steps.post_thread()
    |> Steps.close_thread()
    |> Steps.drag_across_table()
    |> Steps.assert_table_selection_and_highlight()
    |> Steps.reload_and_reopen_table_thread()
  end
end
