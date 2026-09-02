defmodule Operately.Features.ResourceHubDocument.MovementTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubDocumentSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Move" do
    @resource_name "Q3 Planning Brief"

    feature "Moving document to child folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Factory.add_document(:document, :hub, name: @resource_name)
      |> move_resource_to_child_folder(resource_name: @resource_name, type: :document)
    end

    feature "Moving document to parent folder", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Factory.add_document(:document, :hub, folder: :five, name: @resource_name)
      |> move_resource_to_parent_folder(resource_name: @resource_name, type: :document)
    end

    feature "Moving document to resource hub root", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Factory.add_document(:document, :hub, folder: :five, name: @resource_name)
      |> move_resource_to_hub_root(resource_name: @resource_name, type: :document)
    end
  end
end
