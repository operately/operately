defmodule Operately.Features.ResourceHubFile.DeletionTest do
  use Operately.FeatureCase
  use Operately.Support.ResourceHub.Deletion
  use Operately.Support.ResourceHub.Comments
  use Operately.Support.ResourceHub.Moving

  alias Operately.Support.Features.ResourceHubFileSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "Delete" do
    feature "deleting file adds event to feed", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
      |> Steps.assert_file_deleted_on_space_feed()
      |> Steps.assert_file_deleted_on_company_feed()
    end

    feature "deleting file sends notifications", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
      |> Steps.assert_file_deleted_notification_sent()
      |> Steps.assert_file_deleted_email_sent()
    end

    feature "delete file from content list", ctx do
      ctx
      |> Steps.given_file_exists()
      |> delete_resource_from_nodes_list("Some File")
    end

    feature "deleting file from file page redirects to resource hub", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> delete_resource_redirects_to_resource_hub("Documents & Files")
    end

    feature "deleting document within folder from document page redirects to folder", ctx do
      ctx
      |> Steps.given_file_within_folder_exists()
      |> Steps.visit_file_page()
      |> delete_resource_redirects_to_folder()
    end
  end
end
