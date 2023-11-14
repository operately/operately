defmodule Operately.Projects.PermissionsTest do
  use Operately.DataCase

  import Operately.CompaniesFixtures
  import Operately.PeopleFixtures
  import Operately.GroupsFixtures
  import Operately.ProjectsFixtures

  alias Operately.Projects.Permissions

  setup do
    company = company_fixture()
    person = person_fixture(company_id: company.id)
    group = group_fixture(person, %{company_id: company.id})
    project = project_fixture(%{company_id: company.id, creator_id: person.id, group_id: group.id})

    %{company: company, person: person, project: project}
  end

  describe "can_view" do
    test "when the project is public it returns true", ctx do
      permissions = Permissions.calculate_permissions(ctx.project, ctx.person)

      assert permissions.can_view
    end

    test "when the project is private and the person is a contributor it returns true", ctx do
      {:ok, project} = Operately.Projects.update_project(ctx.project, %{private: true})

      permissions = Permissions.calculate_permissions(project, ctx.person)

      assert permissions.can_view
    end

    test "when the project is private and the person is not a contributor it returns false", ctx do
      {:ok, project} = Operately.Projects.update_project(ctx.project, %{private: true})

      non_colab = person_fixture(company_id: ctx.company.id)

      permissions = Permissions.calculate_permissions(project, non_colab)

      refute permissions.can_view
    end
  end

  describe "can_edit_contributors" do
    test "when the person is a contributor it returns true", ctx do
      permissions = Permissions.calculate_permissions(ctx.project, ctx.person)

      assert permissions.can_edit_contributors
    end

    test "when the person is not a contributor it returns false", ctx do
      non_colab = person_fixture(company_id: ctx.company.id)

      permissions = Permissions.calculate_permissions(ctx.project, non_colab)

      refute permissions.can_edit_contributors
    end
  end
end
