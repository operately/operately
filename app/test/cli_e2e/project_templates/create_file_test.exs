defmodule Operately.CliE2E.ProjectTemplates.CreateFileTest do
  use Operately.CliE2ECase

  alias Operately.Support.CliE2E.ProjectTemplates.CreateFileSteps, as: Steps

  test "project_templates create_file uploads a file to the template root", ctx do
    ctx
    |> Steps.setup()
    |> Steps.create_file_at_template_root()
    |> Steps.assert_file_created_successfully()
  end

  test "project_templates create_file uploads a file into a parent folder", ctx do
    ctx
    |> Steps.setup()
    |> Steps.add_parent_folder()
    |> Steps.create_file_in_folder()
    |> Steps.assert_file_created_successfully()
  end
end
