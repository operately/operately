defmodule Operately.Permissions.ReadOnlyTest do
  use ExUnit.Case, async: true

  alias Operately.Access.Binding
  alias Operately.Activities.Permissions, as: ActivityPermissions
  alias Operately.Companies.Permissions, as: CompanyPermissions
  alias Operately.Goals.Permissions, as: GoalPermissions
  alias Operately.Goals.Update.Permissions, as: GoalUpdatePermissions
  alias Operately.Groups.Permissions, as: GroupPermissions
  alias Operately.Messages.Permissions, as: MessagePermissions
  alias Operately.People.Permissions, as: PeoplePermissions
  alias Operately.Projects.Permissions, as: ProjectPermissions
  alias Operately.ResourceHubs.Permissions, as: ResourceHubPermissions

  test "view-based permission modules keep only can_view in read-only mode" do
    assert ProjectPermissions.calculate(Binding.full_access(), company_read_only: true) == %ProjectPermissions{
             can_view: true,
             can_comment: false,
             can_edit: false,
             has_full_access: false
           }

    assert GroupPermissions.calculate_permissions(Binding.full_access(), company_read_only: true) == %GroupPermissions{
             can_view: true,
             can_comment: false,
             can_edit: false,
             has_full_access: false
           }

    assert GoalPermissions.calculate(Binding.full_access(), company_read_only: true) == %GoalPermissions{
             can_view: true,
             can_edit: false,
             can_comment: false,
             has_full_access: false
           }

    assert ActivityPermissions.calculate_permissions(Binding.full_access(), company_read_only: true) == %ActivityPermissions{
             can_view: true,
             can_edit_comment_thread: false,
             can_comment_on_thread: false
           }
  end

  test "goal updates keep can_view only and deny edit helpers in read-only mode" do
    update = %Operately.Goals.Update{
      goal_id: "goal-1",
      author_id: "author",
      goal: %Operately.Goals.Goal{
        id: "goal-1",
        champion_id: "champion",
        reviewer_id: "reviewer"
      }
    }

    assert GoalUpdatePermissions.calculate(Binding.full_access(), update, "reviewer", company_read_only: true) == %GoalUpdatePermissions{
             can_view: true,
             can_edit: false,
             can_delete: false,
             can_acknowledge: false,
             can_comment: false
           }

    assert GoalUpdatePermissions.check_can_edit(Binding.full_access(), company_read_only: true) == {:error, :unauthorized}
  end

  test "resource hub permissions keep only can_view in read-only mode" do
    permissions = ResourceHubPermissions.calculate(Binding.full_access(), company_read_only: true)

    assert permissions.can_view
    refute permissions.can_create_document
    refute permissions.can_create_folder
    refute permissions.can_create_file
    refute permissions.can_create_link
    refute permissions.can_delete_document
    refute permissions.can_delete_file
    refute permissions.can_delete_folder
    refute permissions.can_delete_link
    refute permissions.can_edit_document
    refute permissions.can_edit_file
    refute permissions.can_edit_link
    refute permissions.can_edit_parent_folder
    refute permissions.can_rename_folder
    refute permissions.can_copy_folder
    refute permissions.can_comment_on_document
    refute permissions.can_comment_on_file
    refute permissions.can_comment_on_link
  end

  test "permissions without can_view deny everything in read-only mode" do
    person = %{id: "person-1"}
    message = %{author_id: "person-1", request_info: %{access_level: Binding.full_access()}}

    assert PeoplePermissions.calculate(Binding.full_access(), company_read_only: true) == %PeoplePermissions{
             can_edit_profile: false
           }

    assert MessagePermissions.calculate(person, message, company_read_only: true) == %MessagePermissions{
             can_archive_message: false
           }
  end

  test "company permissions keep admin, billing-management, and view access in read-only mode" do
    assert CompanyPermissions.calculate(Binding.admin_access(), company_read_only: true) == %CompanyPermissions{
             can_view: true,
             is_admin: true,
             can_manage_billing: true,
             can_edit_trusted_email_domains: false,
             can_invite_members: false,
             can_edit_members: false,
             can_remove_members: true,
             can_restore_members: false,
             can_create_space: false,
             can_manage_admins: false,
             can_manage_owners: false,
             can_edit_details: false,
             can_edit_members_access_levels: false
           }
  end
end
