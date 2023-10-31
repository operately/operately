defmodule OperatelyEmail.Views.ProjectTimelineEdited do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_timeline_edited.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_timeline_edited.text.eex", [:assigns])
end
