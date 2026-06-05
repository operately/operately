defmodule Operately.Features.ResourceHubDocument.MovementTest do
  use Operately.FeatureCase
  use Operately.Support.Features.ResourceHubDocumentCase

  describe "Move" do
    @resource_name "Document"

    feature "Moving document to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.given_document_within_resource_hub_root_exists(:hub)
      |> move_resource_to_child_folder(resource_name: @resource_name)
    end

    feature "Moving document to parent folder", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> move_resource_to_parent_folder(resource_name: @resource_name)
    end

    feature "Moving document to resource hub root", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> move_resource_to_hub_root(resource_name: @resource_name)
    end
  end
end
