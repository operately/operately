defmodule OperatelyEmail.Views.GoalCreated do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/goal_created.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/goal_created.text.eex", [:assigns])
end
