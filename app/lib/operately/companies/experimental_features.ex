defmodule Operately.Companies.ExperimentalFeatures do
  @available ~w(project_templates document_inline_comments)

  def available, do: @available
end
