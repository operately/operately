defmodule OperatelyEmail.Views.Update do
  require EEx
  @templates_root "lib/operately_email/templates"

  EEx.function_from_file(:def, :html, "#{@templates_root}/update.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/update.text.eex", [:assigns])
end
