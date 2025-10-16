defmodule OperatelyEmail.Templates do
  use Phoenix.View, root: "lib/operately_email", namespace: OperatelyEmail, pattern: "**/*"

  #
  # Utils
  #

  def head(_title), do: ""
  def body(do: _content), do: ""

  def cta_button(url, text) do
    render("partials/_cta_button.html", url: url, text: text)
  end

  def title(text), do: title(text, font_size: "24")

  def title(text, font_size: font_size) do
    render("partials/_title.html", text: text, font_size: font_size)
  end

  def spacer do
    render("partials/_spacer.html")
  end

  def row(do: content), do: row(%{padding_top: 0, padding_bottom: 0}, do: content)

  def row(%{padding_top: pt, padding_bottom: pb}, do: content) do
    render("partials/_row.html", content: content, padding_top: pt, padding_bottom: pb)
  end

  def line do
    render("partials/_line.html")
  end

  def link(url, text) do
    render("partials/_link.html", url: url, text: text)
  end

  def subtle(text) do
    render("partials/_subtle.html", text: text)
  end

  # Keep this in sync with the colors in the Operately UI
  # defined in assets/css/prosemirror.css

  @highlights %{
    "textYellow" => "color: #eab308; background-color: transparent;",
    "textOrange" => "color: #f97316; background-color: transparent;",
    "textRed" => "color: #ef4444; background-color: transparent;",
    "textPurple" => "color: #a855f7; background-color: transparent;",
    "textBlue" => "color: #3b82f6; background-color: transparent;",
    "textGreen" => "color: #22c55e; background-color: transparent;",
    "bgYellow" => "background-color: #fef08a;",
    "bgOrange" => "background-color: #fed7aa;",
    "bgRed" => "background-color: #fecaca;",
    "bgPurple" => "background-color: #e9d5ff;",
    "bgBlue" => "background-color: #bfdbfe;",
    "bgGreen" => "background-color: #bbf7d0;"
  }

  def rich_text(content) do
    opts = struct!(Prosemirror2Html.Options, domain: OperatelyWeb.Endpoint.url(), highlights: @highlights)
    {:safe, Prosemirror2Html.convert(content, opts)}
  end

  def assignment_to_text(assignment) do
    case assignment.type do
      :project ->
        "- Check-In #{assignment.url}"

      :goal ->
        "- Progress Update #{assignment.url}"

      :check_in ->
        "- Acknowledge Check-In #{assignment.url}"

      :goal_update ->
        "- Acknowledge Progress Update #{assignment.url}"
    end
  end

  def short_name(person) do
    Operately.People.Person.short_name(person)
  end
end
