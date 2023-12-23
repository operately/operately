defmodule OperatelyEmail.Templates do
  use Phoenix.View, root: "lib/operately_email", namespace: OperatelyEmail, pattern: "**/*"

  #
  # Utils
  #

  def head(_title), do: ""
  def body(do: _content), do: ""

  def cta_button(url, text) do
    render "partials/_cta_button.html", url: url, text: text
  end

  def title(text), do: title(text, font_size: "24")

  def title(text, font_size: font_size) do
    render "partials/_title.html", text: text, font_size: font_size
  end

  def spacer do
    render "partials/_spacer.html"
  end

  def row(do: content), do: row(%{padding_top: 0, padding_bottom: 0}, do: content)

  def row(%{padding_top: pt, padding_bottom: pb}, do: content) do
    render "partials/_row.html", content: content, padding_top: pt, padding_bottom: pb
  end

  def line do
    render "partials/_line.html"
  end

  def link(url, text) do
    render "partials/_link.html", url: url, text: text
  end

  def subtle(text) do
    render "partials/_subtle.html", text: text
  end

  def rich_text(content) do
    opts = [domain: OperatelyWeb.Endpoint.url()]

    {:safe, Prosemirror2Html.convert(content, opts)}
  end

  def assignments_to_text(assignments) do
    Enum.map(assignments, &assignment_to_text/1) |> Enum.join("\n")
  end

  def assignment_to_text(assignment) do
    case assignment.type do
    :status_update ->
      "- Check-In #{assignment.url}"
    :goal_check_in ->
      "- Check-In #{assignment.url}"
    :milestone ->
      "- Complete the #{assignment.name} milestone #{assignment.url}"
    end
  end

  def short_name(person) do
    Operately.People.Person.short_name(person)
  end
end
