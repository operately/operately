defmodule Operately.Features.ResourceHubFile.MovementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubFileCase

  describe "Move" do
    @resource_name "Some File"

    feature "Moving file to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_file_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving file to parent folder", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving file to resource hub root", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
