defmodule Operately.Features.ResourceHubFile.MovementTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubFileSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Move" do
    @resource_name "Some File"

    feature "Moving file to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_file_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name, type: :file)
    end

    feature "Moving file to parent folder", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name, type: :file)
    end

    feature "Moving file to resource hub root", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name, type: :file)
    end
  end
end
