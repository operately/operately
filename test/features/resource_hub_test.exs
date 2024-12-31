defmodule Features.Features.ResourceHubTest do
  use Operately.FeatureCase

  alias Operately.Support.Features.ResourceHubSteps, as: Steps

  @document %{
    name: "My First Document",
    content: "This is the document's content",
  }

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
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> Steps.assert_document_created_on_space_feed(@document)
      |> Steps.assert_document_created_on_company_feed(@document)
      |> Steps.assert_document_created_notification_sent(@document.name)
      |> Steps.assert_document_created_email_sent(@document.name)
    end

    feature "edit document", ctx do
      new_doc = %{
        name: "Edited name",
        content: "Brand new content",
      }

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> Steps.edit_document(new_doc)
      |> Steps.assert_document_content(new_doc)
      |> Steps.assert_document_edited_on_space_feed(new_doc.name)
      |> Steps.assert_document_edited_on_company_feed(new_doc.name)
      |> Steps.assert_document_edited_notification_sent()
      |> Steps.assert_document_edited_email_sent(new_doc.name)
    end

    feature "delete document from content list", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> Steps.navigate_back("Documents & Files")
      |> Steps.delete_document(@document.name)
      |> Steps.assert_document_deleted(@document.name)
      |> Steps.assert_document_deleted_on_space_feed(@document.name)
      |> Steps.assert_document_deleted_on_company_feed(@document.name)
      |> Steps.assert_document_deleted_notification_sent(@document.name)
      |> Steps.assert_document_deleted_email_sent(@document.name)
    end

    feature "deleting document from document page redirects to resource hub", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.assert_document_content(@document)
      |> Steps.delete_document()
      |> Steps.assert_page_is_resource_hub_root(name: "Documents & Files")
      |> Steps.assert_zero_state()
    end

    feature "deleting document within folder from document page redirects to folder", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> Steps.visit_document_page()
      |> Steps.delete_document()
      |> Steps.assert_page_is_folder_root(folder_key: :five)
      |> Steps.assert_zero_folder_state()
    end

    feature "copy document in the same folder", ctx do
      new_name = "Document (copy)"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.go_to_copy_document_page(@document.name)
      |> Steps.enter_document_name(new_name)
      |> Steps.copy_document()
      |> Steps.visit_resource_hub_page()
      |> Steps.assert_document_present_in_files_list(new_name)
      |> Steps.assert_document_copied_on_company_feed(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_on_space_feed(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_notification_sent(%{name: @document.name, new_name: new_name})
      |> Steps.assert_document_copied_email_sent(new_name)
    end

    feature "copy document into another folder", ctx do
      new_name = "Document (copy)"

      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_folder("My Folder")
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.go_to_copy_document_page(@document.name)
      |> Steps.enter_document_name(new_name)
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.copy_document()
      |> Steps.visit_resource_hub_page()
      |> Steps.refute_document_present_in_files_list(new_name)
      |> Steps.navigate_to_folder(index: 0)
      |> Steps.assert_document_present_in_files_list(new_name)
    end
  end

  describe "comments" do
    feature "add comment to document", ctx do
      ctx
      |> Steps.visit_resource_hub_page()
      |> Steps.create_document(@document)
      |> Steps.leave_comment()
      |> Steps.leave_comment()
      |> Steps.navigate_back("Documents & Files")
      |> Steps.assert_comments_count(%{index: 0, count: "2"})
      |> Steps.assert_document_commented_on_company_feed(@document.name)
      |> Steps.assert_document_commented_on_space_feed(@document.name)
      |> Steps.assert_document_commented_notification_sent(@document.name)
      |> Steps.assert_document_commented_email_sent(@document.name)
    end

    feature "add comment to file", ctx do
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

  describe "navigation" do
    feature "folder navigation works", ctx do
      ctx
      |> Steps.given_nested_folders_exist()
      |> Steps.visit_folder_page(:five)
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four"])
      |> Steps.navigate_back("three")
      |> Steps.refute_navigation_links(["three", "four"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two"])
      |> Steps.navigate_back("one")
      |> Steps.refute_navigation_links(["one", "two"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
    end

    feature "document navigation works", ctx do
      ctx
      |> Steps.given_document_within_nested_folders_exists()
      |> Steps.visit_document_page()
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
      |> Steps.navigate_back("four")
      |> Steps.refute_navigation_links(["four", "five"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
      |> Steps.navigate_back("one")
      |> Steps.refute_navigation_links(["one", "two", "three"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub"])
    end

    feature "file navigation works", ctx do
      ctx
      |> Steps.given_file_within_nested_folders_exists()
      |> Steps.visit_file_page()
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three", "four", "five"])
      |> Steps.navigate_back("four")
      |> Steps.refute_navigation_links(["four", "five"])
      |> Steps.assert_navigation_links(["Product Space", "Resource hub", "one", "two", "three"])
      |> Steps.navigate_back("Resource hub")
      |> Steps.refute_navigation_links(["Resource hub", "one", "two", "three"])
      |> Steps.assert_navigation_links(["Product Space"])
    end
  end
end
