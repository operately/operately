defmodule Operately.Support.Features.EditorSteps do
  use Operately.FeatureCase

  #
  # We will test all the features of the editor by creating
  # a discussion. The author will be the author of the discussion.
  # While the reader will be the reader of the discussion who
  # will receive the email.
  #
  def setup(ctx) do
    ctx
    |> Factory.setup()
    |> Factory.add_space(:marketing_space)
    |> Factory.add_space_member(:author, :marketing_space)
    |> Factory.add_space_member(:reader, :marketing_space)
    |> Factory.log_in_person(:author)
  end

  step :post_message_with_bold_italics_strikethrough, ctx do
    ctx
    |> start_new_discussion()
    # bold
    |> toggle_bold()
    |> append_text("bolded text")
    |> toggle_bold()
    # italics
    |> toggle_italics()
    |> append_text("italicized text")
    |> toggle_italics()
    # strikethrough
    |> toggle_strikethrough()
    |> append_text("strikethrough text")
    |> toggle_strikethrough()
    # submit
    |> submit_discussion()
  end

  step :post_message_with_divider, ctx do
    ctx
    |> start_new_discussion()
    |> append_text("This is a discussion with a divider")
    |> add_divider()
    |> append_text("This is the second part of the discussion")
    |> submit_discussion()
  end

  step :post_message_with_highlight, ctx do
    ctx
    |> start_new_discussion()
    |> select_color("textYellow")
    |> append_text("Yellow")
    |> select_color("bgOrange")
    |> append_text("Orange")
    |> submit_discussion()
  end

  step :assert_highlight_is_visible_on_discussion_page, ctx do
    ctx
    |> UI.assert_has(Query.css("mark[data-highlight='textYellow']", text: "Yellow"))
    |> UI.assert_has(Query.css("mark[data-highlight='bgOrange']", text: "Orange"))
  end

  step :assert_highlight_removed_from_feed_summary, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.refute_has(Query.css("mark[data-highlight='textYellow']", text: "Yellow"))
    |> UI.refute_has(Query.css("mark[data-highlight='bgOrange']", text: "Orange"))
    |> UI.assert_text("YellowOrange")
  end

  step :assert_highlight_is_visible_in_email, _ctx do
    email = UI.Emails.last_sent_email()

    assert String.contains?(email.html, "<mark style=\"color: #eab308; background-color: transparent;\">")
    assert String.contains?(email.html, "<mark style=\"background-color: #fed7aa;\">")
  end

  step :assert_bold_italics_strikethrough_are_visible_on_discussion_page, ctx do
    ctx
    |> UI.assert_has(Query.css("strong", text: "bolded text"))
    |> UI.assert_has(Query.css("em", text: "italicized text"))
    |> UI.assert_has(Query.css("s", text: "strikethrough text"))
  end

  step :assert_bold_italics_strikethrough_removed_from_feed_summary, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.assert_text("bolded text italicized text strikethrough text")
    |> UI.refute_has(Query.css("strong", text: "bolded text"))
    |> UI.refute_has(Query.css("em", text: "italicized text"))
    |> UI.refute_has(Query.css("s", text: "strikethrough text"))
  end

  step :assert_bold_italics_strikethrough_are_visible_in_email, _ctx do
    email = UI.Emails.last_sent_email()

    assert String.contains?(email.html, "<strong>bolded text</strong>")
    assert String.contains?(email.html, "<em>italicized text</em>")
    assert String.contains?(email.html, "<strike>strikethrough text</strike>")
  end

  step :assert_divider_is_visible_on_discussion_page, ctx do
    ctx |> UI.assert_has(Query.css("hr"))
  end

  step :assert_divider_removed_from_feed_summary, ctx do
    ctx
    |> UI.visit(Paths.space_path(ctx.company, ctx.marketing_space))
    |> UI.refute_has(Query.css("hr"))
  end

  step :assert_divider_is_visible_in_email, _ctx do
    email = UI.Emails.last_sent_email()
    assert String.contains?(email.html, "<hr>")
  end

  #
  # Utilities
  #

  def start_new_discussion(ctx) do
    ctx
    |> UI.visit(Paths.space_discussions_path(ctx.company, ctx.marketing_space))
    |> UI.click(testid: "new-discussion")
    |> UI.fill(testid: "discussion-title", with: "Example Discussion")
  end

  def toggle_bold(ctx) do
    ctx |> UI.click(testid: "toolbar-button-bold")
  end

  def toggle_italics(ctx) do
    ctx |> UI.click(testid: "toolbar-button-italic")
  end

  def toggle_strikethrough(ctx) do
    ctx |> UI.click(testid: "toolbar-button-strikethrough")
  end

  def append_text(ctx, text) do
    UI.find(ctx, Query.css(".ProseMirror[contenteditable=true]"), fn el ->
      Wallaby.Browser.send_keys(el.session, text)
    end)
  end

  def submit_discussion(ctx) do
    ctx
    |> UI.click(testid: "post-discussion")
    |> UI.assert_has(testid: "discussion-page")
  end

  def add_divider(ctx) do
    ctx |> UI.click(testid: "toolbar-button-divider")
  end

  def select_color(ctx, color) do
    ctx
    |> UI.click(testid: "toolbar-button-highlight")
    |> UI.click(testid: color)
  end
end
