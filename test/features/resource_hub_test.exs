defmodule Features.Features.ResourceHubTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  setup ctx, do: Steps.setup(ctx)

  describe "folders" do
    feature "resource hub zero state", ctx do
      ctx
      |> Steps.visit_space_page()
      |> Steps.assert_zero_state_on_space_page()
      |> Steps.navigate_to_resource_hub_page()
      |> Steps.assert_zero_state()
    end

    feature "create folders at the root of resource hub", ctx do
      folder1 = "First Folder"
      folder2 = "Second Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder1)
      |> Steps.assert_folder_created(%{name: folder1, index: 0})
      |> Steps.create_folder(folder2)
      |> Steps.assert_folder_created(%{name: folder2, index: 1})
    end

    feature "create nested folders", ctx do
      folder1 = "First Folder"
      folder2 = "Second Folder"
      folder3 = "Third Folder"
      folder4 = "Forth Folder"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder1)
      |> Steps.assert_folder_created(%{name: folder1, index: 0})
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.create_folder(folder2)
      |> Steps.assert_folder_created(%{name: folder2, index: 0})
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.create_folder(folder4)
      |> Steps.assert_folder_created(%{name: folder4, index: 0})
      |> Steps.create_folder(folder3)
      |> Steps.assert_folder_created(%{name: folder3, index: 1})
      |> Steps.navigate_back(folder1)
      |> Steps.assert_items_count(%{index: 0, items_count: "2 items"})
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_items_count(%{index: 0, items_count: "1 item"})
    end

    feature "folder navigation works", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.visit_folder_page(:five)
      |> Steps.assert_navigation_links(["Resource hub", "one", "two", "three", "four"])
      |> Steps.navigate_back("three")
      |> Steps.refute_navigation_links(["three", "four"])
      |> Steps.assert_navigation_links(["Resource hub", "one", "two"])
      |> Steps.navigate_back("one")
      |> Steps.refute_navigation_links(["one", "two"])
      |> Steps.assert_navigation_links(["Resource hub"])
    end

    feature "folder created feed event", ctx do
      folder = "Documents"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder(folder)
      |> Steps.assert_folder_created(%{name: folder, index: 0})
      |> Steps.assert_folder_created_on_space_feed(folder)
      |> Steps.assert_folder_created_on_company_feed(folder)
    end
  end

  describe "documents" do
    feature "create document", ctx do
      doc = %{
        name: "My First Document",
        content: "This is the document's content",
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(doc)
      |> Steps.assert_document_content(doc)
      |> Steps.assert_document_created_on_space_feed(doc)
      |> Steps.assert_document_created_on_company_feed(doc)
      |> Steps.assert_document_created_notification_sent(doc.name)
      |> Steps.assert_document_created_email_sent(doc.name)
    end

    feature "edit document", ctx do
      default_doc = %{
        name: "some name",
        content: "Content",
      }
      new_doc = %{
        name: "Edited name",
        content: "Brand new content",
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(default_doc)
      |> Steps.assert_document_content(default_doc)
      |> Steps.edit_document(new_doc)
      |> Steps.assert_document_content(new_doc)
      |> Steps.assert_document_edited_on_space_feed(new_doc.name)
      |> Steps.assert_document_edited_on_company_feed(new_doc.name)
      |> Steps.assert_document_edited_notification_sent()
      |> Steps.assert_document_edited_email_sent(new_doc.name)
    end

    feature "delete document", ctx do
      doc = %{
        name: "My First Document",
        content: "This is the document's content",
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(doc)
      |> Steps.assert_document_content(doc)
      |> Steps.navigate_back("Documents & Files")
      |> Steps.delete_document(doc.name)
      |> Steps.assert_document_deleted(doc.name)
      |> Steps.assert_document_deleted_on_space_feed(doc.name)
      |> Steps.assert_document_deleted_on_company_feed(doc.name)
      |> Steps.assert_document_deleted_notification_sent(doc.name)
      |> Steps.assert_document_deleted_email_sent(doc.name)
    end
  end

  describe "comments" do
    feature "add comment to document", ctx do
      doc = %{
        name: "My First Document",
        content: "This is the document's content",
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(doc)
      |> Steps.leave_comment()
      |> Steps.leave_comment()
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_comments_count(%{index: 0, count: "2"})
      |> Steps.assert_document_commented_on_company_feed(doc.name)
      |> Steps.assert_document_commented_on_space_feed(doc.name)
      |> Steps.assert_document_commented_notification_sent(doc.name)
      |> Steps.assert_document_commented_email_sent(doc.name)
    end

    test "add comment to file", ctx do
      ctx
      |> Steps.given_file_exists()
      |> Steps.visit_file_page()
      |> Steps.leave_comment()
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_comments_count(%{index: 0, count: "1"})
      |> Steps.assert_file_commented_on_company_feed()
      |> Steps.assert_file_commented_on_space_feed()
      |> Steps.assert_file_commented_notification_sent()
      |> Steps.assert_file_commented_email_sent()
    end
  end
end
