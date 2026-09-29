defmodule Operately.Features.RichTextResourceLinksTest do
  use Operately.FeatureCase
  alias Operately.Support.Features.RichTextResourceLinksSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  feature "paste a known link, see its title, save and reopen", ctx do
    ctx
    |> Steps.edit_document()
    |> Steps.paste_link()
    |> Steps.assert_editor_title()
    |> Steps.save_document()
    |> Steps.assert_persisted_url()
    |> Steps.edit_document()
    |> Steps.assert_editor_title()
  end

  feature "saving before the lookup finishes preserves the URL", ctx do
    ctx
    |> Steps.edit_document()
    |> Steps.paste_and_save_immediately()
    |> Steps.assert_persisted_url()
    |> Steps.edit_document()
    |> Steps.assert_editor_title()
  end
end
