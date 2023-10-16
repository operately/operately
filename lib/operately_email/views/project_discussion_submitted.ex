defmodule OperatelyEmail.Views.ProjectDiscussionSubmitted do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_discussion_submitted.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_discussion_submitted.text.eex", [:assigns])
end
