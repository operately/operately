defmodule OperatelyEmail.Views.ProjectMoved do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_moved.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_moved.text.eex", [:assigns])
end
