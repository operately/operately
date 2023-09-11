defmodule OperatelyEmail.Views.Assignments do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/assignments.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/assignments.text.eex", [:assigns])

  #
  # Utils for rendering the text version of the email
  #

  def assignments_to_text(assignments) do
    Enum.map(assignments, &assignment_to_text/1) |> Enum.join("\n")
  end

  def assignment_to_text(assignment) do
    case assignment.type do
    :status_update ->
      "- Post a status update #{assignment.url}"
    :milestone ->
      "- Complete the #{assignment.name} milestone #{assignment.url}"
    end
  end
end
