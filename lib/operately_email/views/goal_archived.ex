defmodule OperatelyEmail.Views.GoalArchived do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents
  alias Operately.People.Person

  EEx.function_from_file(:def, :html, "#{@templates_root}/goal_archived.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/goal_archived.text.eex", [:assigns])
end
