defmodule OperatelyEmail.Views.Assignments do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/assignments.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/assignments.text.eex", [:assigns])
end
