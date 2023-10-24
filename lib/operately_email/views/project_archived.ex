defmodule OperatelyEmail.Views.ProjectArchived do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_archived.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_archived.text.eex", [:assigns])
end
