defmodule Operately.Support.Features.ResourceHubDocument.LiveUpdatesSteps do
  use Operately.FeatureCase

  step :start_comment, ctx do
    Wallaby.Browser.resize_window(ctx.session, 1280, 700)

    ctx = ctx |> UI.click(testid: "add-comment") |> UI.fill_rich_text("An unfinished review")

    UI.execute("remember_reader_position", ctx, fn session ->
      Wallaby.Browser.execute_script(session, "window.documentReaderScrollY = window.scrollY")
    end)
  end

  step :save_document_remotely, ctx do
    ctx = Factory.add_api_token(ctx, :api_token, :other_user, read_only: false)
    conn = Phoenix.ConnTest.build_conn() |> Plug.Conn.put_req_header("content-type", "application/json")

    assert {200, _} =
             OperatelyWeb.TurboCase.external_mutation(conn, ctx.api_token, "documents/update", %{
               document_id: Paths.document_id(ctx.document),
               name: "Updated document title",
               content: Operately.Support.RichText.rich_text("Updated document body", :as_string)
             })

    ctx
  end

  step :assert_updated_document_and_preserved_draft, ctx do
    ctx =
      ctx
      |> UI.assert_text("Updated document title")
      |> UI.assert_text("Updated document body")
      |> UI.assert_has(Wallaby.Query.css("[data-test-id='new-comment-form'] [contenteditable=true]", text: "An unfinished review"))

    UI.execute("assert_reader_position", ctx, fn session ->
      Wallaby.Browser.execute_script(session, "return Math.abs(window.scrollY - window.documentReaderScrollY) < 30", fn preserved ->
        assert preserved
      end)
    end)
  end
end
