defmodule OperatelyEmail.Views.ProjectCreated do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_created.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_created.text.eex", [:assigns])

  #
  # Utils for rendering the text version of the email
  #

  def cta_button(url, text), do: OperatelyEmail.Views.ProjectContributorAdded.cta_button(url, text)
end
