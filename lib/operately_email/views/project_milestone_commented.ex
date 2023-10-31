defmodule OperatelyEmail.Views.ProjectMilestoneCommented do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_milestone_commented.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_milestone_commented.text.eex", [:assigns])
end
