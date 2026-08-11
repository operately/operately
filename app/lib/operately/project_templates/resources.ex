defmodule Operately.ProjectTemplates.Resources do
  @moduledoc """
  Copies, materializes, and validates the reusable Docs & Files tree owned by a project template.

  The public functions form the boundary used by the project-to-template and
  template-to-project operations. Their implementation is grouped by direction,
  with shared tree traversal kept separate from persistence concerns.
  """

  alias __MODULE__.{Materialization, ReverseCopy, Validator}

  def copy_from_project(repo, project_id, template), do: ReverseCopy.run(repo, project_id, template)
  def materialize(repo, template, project, creator_id), do: Materialization.run(repo, template, project, creator_id)
  def validate(nodes), do: Validator.run(nodes)
end
