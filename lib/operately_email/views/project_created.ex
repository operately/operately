defmodule OperatelyEmail.Views.ProjectCreated do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_created.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_created.text.eex", [:assigns])

  #
  # Utils for rendering the text version of the email
  #

  def cta_button(url, text) do
    "<a href='#{url}' style='cursor: pointer; font-family: sans-serif; font-weight: 600; padding: 10px 20px; background: #16a34a; color: white; border-radius: 6px; text-decoration: none;'>#{text}</a>"
  end
end
