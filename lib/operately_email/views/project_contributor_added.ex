defmodule OperatelyEmail.Views.ProjectContributorAdded do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_contributor_added.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_contributor_added.text.eex", [:assigns])

  def cta_button(url, text) do
    "<a href='#{url}' style='display: inline-block; cursor: pointer; font-family: sans-serif; font-weight: 600; padding: 10px 20px; background: #16a34a; color: white; border-radius: 6px; text-decoration: none;'>#{text}</a>"
  end
end
