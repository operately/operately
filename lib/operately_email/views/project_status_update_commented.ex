defmodule OperatelyEmail.Views.ProjectStatusUpdateCommented do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_status_update_commented.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_status_update_commented.text.eex", [:assigns])
end
