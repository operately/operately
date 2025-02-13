defmodule Operately.Features.EditorTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.EditorSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "support for bold/italics/strikethrough", ctx do
    ctx
    |> Steps.post_message_with_bold_italics_strikethrough()
    |> Steps.assert_bold_italics_strikethrough_are_visible_on_discussion_page()
    |> Steps.assert_bold_italics_strikethrough_removed_from_feed_summary()
    |> Steps.assert_bold_italics_strikethrough_are_visible_in_email()
  end
end
