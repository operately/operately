defmodule OperatelyEmail.Views.ProjectReviewRequest do
  require EEx
  @templates_root "lib/operately_email/templates"

  import OperatelyEmail.Views.UIComponents

  EEx.function_from_file(:def, :html, "#{@templates_root}/project_review_request.html.eex", [:assigns])
  EEx.function_from_file(:def, :text, "#{@templates_root}/project_review_request.text.eex", [:assigns])
end
