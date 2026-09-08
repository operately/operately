defmodule Operately.Features.Projects.ProjectPageDeletionTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.Projects.ProjectPageDeletionSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  @tag login_as: :champion
  feature "delete a project through the confirmation dialog", ctx do
    ctx
    |> Steps.visit_project_page()
    |> Steps.delete_project()
    |> Steps.assert_project_deleted()
  end
end
