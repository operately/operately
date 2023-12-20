defmodule OperatelyEmail.Templates do
  alias Operately.People.Person

  use Phoenix.View, root: "lib/operately_email", namespace: OperatelyEmail, pattern: "**/*"

  #
  # Utils
  #

  def head(_title), do: ""
  def body(do: _content), do: ""

  def cta_button(url, text) do
    render "partials/_cta_button.html", url: url, text: text
  end

  def title(text) do
    render "partials/_title.html", text: text
  end

  def spacer do
    render "partials/_spacer.html"
  end

  def row(do: content) do
    render "partials/_row.html", content: content
  end

  def rich_text(content) do
    opts = [domain: OperatelyWeb.Endpoint.url()]

    Prosemirror2Html.convert(content, opts)
  end

  def assignments_to_text(assignments) do
    Enum.map(assignments, &assignment_to_text/1) |> Enum.join("\n")
  end

  def assignment_to_text(assignment) do
    case assignment.type do
    :status_update ->
      "- Check-In #{assignment.url}"
    :milestone ->
      "- Complete the #{assignment.name} milestone #{assignment.url}"
    end
  end

  def short_name(person) do
    Operately.People.Person.short_name(person)
  end
end
