defmodule Operately.ProjectsTest do
  use Operately.DataCase

  alias Operately.Projects

  import Operately.ProjectsFixtures
  import Operately.PeopleFixtures
  import Operately.CompaniesFixtures

  describe "projects" do
    alias Operately.Projects.Project

    import Operately.ProjectsFixtures

    @invalid_attrs %{description: nil, name: nil}

    test "list_projects/0 returns all projects" do
      project = project_fixture()
      assert Projects.list_projects() == [project]
    end

    test "get_project!/1 returns the project with given id" do
      project = project_fixture()
      assert Projects.get_project!(project.id) == project
    end

    test "create_project/1 with valid data creates a project" do
      valid_attrs = %{description: %{}, name: "some name"}

      assert {:ok, %Project{} = project} = Projects.create_project(valid_attrs, nil)
      assert project.name == "some name"
    end

    test "create_project/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project(@invalid_attrs)
    end

    test "update_project/2 with valid data updates the project" do
      project = project_fixture()
      update_attrs = %{name: "some updated name"}

      assert {:ok, %Project{} = project} = Projects.update_project(project, update_attrs)
      assert project.name == "some updated name"
    end

    test "update_project/2 with invalid data returns error changeset" do
      project = project_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_project(project, @invalid_attrs)
      assert project == Projects.get_project!(project.id)
    end

    test "delete_project/1 deletes the project" do
      project = project_fixture()
      assert {:ok, %Project{}} = Projects.delete_project(project)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_project!(project.id) end
    end

    test "change_project/1 returns a project changeset" do
      project = project_fixture()
      assert %Ecto.Changeset{} = Projects.change_project(project)
    end
  end

  describe "project_milestones" do
    alias Operately.Projects.Milestone

    import Operately.ProjectsFixtures

    @invalid_attrs %{deadline_at: nil, title: nil}

    setup do
      project = project_fixture()
      milestone = milestone_fixture(%{project_id: project.id})

      {:ok, project: project, milestone: milestone}
    end

    test "list_project_milestones/1 returns all project_milestones", ctx do
      assert Projects.list_project_milestones(ctx.project) == [ctx.milestone]
    end

    test "get_milestone!/1 returns the milestone with given id", ctx do
      assert Projects.get_milestone!(ctx.milestone.id) == ctx.milestone
    end

    test "create_milestone/1 with valid data creates a milestone" do
      valid_attrs = %{deadline_at: ~N[2023-05-10 08:16:00], title: "some title"}

      assert {:ok, %Milestone{} = milestone} = Projects.create_milestone(valid_attrs)
      assert milestone.deadline_at == ~N[2023-05-10 08:16:00]
      assert milestone.title == "some title"
    end

    test "create_milestone/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_milestone(@invalid_attrs)
    end

    test "update_milestone/2 with valid data updates the milestone" do
      milestone = milestone_fixture()
      update_attrs = %{deadline_at: ~N[2023-05-11 08:16:00], title: "some updated title"}

      assert {:ok, %Milestone{} = milestone} = Projects.update_milestone(milestone, update_attrs)
      assert milestone.deadline_at == ~N[2023-05-11 08:16:00]
      assert milestone.title == "some updated title"
    end

    test "update_milestone/2 with invalid data returns error changeset" do
      milestone = milestone_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_milestone(milestone, @invalid_attrs)
      assert milestone == Projects.get_milestone!(milestone.id)
    end

    test "delete_milestone/1 deletes the milestone" do
      milestone = milestone_fixture()
      assert {:ok, %Milestone{}} = Projects.delete_milestone(milestone)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_milestone!(milestone.id) end
    end

    test "change_milestone/1 returns a milestone changeset" do
      milestone = milestone_fixture()
      assert %Ecto.Changeset{} = Projects.change_milestone(milestone)
    end
  end

  describe "project_contributors" do
    alias Operately.Projects.Contributor

    setup do
      company = company_fixture()
      project = project_fixture()
      person = person_fixture(%{company_id: company.id})

      contributor = contributor_fixture(%{
        project_id: project.id, 
        person_id: person.id
      })

      {:ok, project: project, person: person, contributor: contributor}
    end

    test "list_project_contributors/0 returns all project_contributors", ctx do
      assert Projects.list_project_contributors(ctx.project) == [ctx.contributor]
    end

    test "get_contributor!/1 returns the contributor with given id", ctx do
      assert Projects.get_contributor!(ctx.contributor.id) == ctx.contributor
    end

    test "create_contributor/1 with valid data creates a contributor", ctx do
      valid_attrs = %{
        project_id: ctx.project.id,
        person_id: ctx.person.id,
        responsibility: "some responsibility"
      }

      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(valid_attrs)
      assert contributor.responsibility == "some responsibility"
    end

    test "update_contributor/2 with valid data updates the contributor", ctx do
      update_attrs = %{responsibility: "some updated responsibility"}

      assert {:ok, %Contributor{} = contributor} = Projects.update_contributor(ctx.contributor, update_attrs)
      assert contributor.responsibility == "some updated responsibility"
    end

    test "delete_contributor/1 deletes the contributor", ctx do
      assert {:ok, %Contributor{}} = Projects.delete_contributor(ctx.contributor)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_contributor!(ctx.contributor.id) end
    end

    test "change_contributor/1 returns a contributor changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_contributor(ctx.contributor)
    end
  end

  describe "project_documents" do
    alias Operately.Projects.Document

    import Operately.ProjectsFixtures

    @invalid_attrs %{content: nil, title: nil}

    setup do
      company = company_fixture()
      project = project_fixture()
      person = person_fixture(%{company_id: company.id})

      document = document_fixture(%{
        project_id: project.id, 
        author_id: person.id
      })

      {:ok, project: project, document: document, person: person}
    end

    test "list_project_documents/0 returns all project_documents", ctx do
      assert Projects.list_project_documents() == [ctx.document]
    end

    test "get_document!/1 returns the document with given id", ctx do
      assert Projects.get_document!(ctx.document.id) == ctx.document
    end

    test "create_document/1 with valid data creates a document", ctx do
      valid_attrs = %{
        content: %{}, 
        title: "some title", 
        author_id: ctx.person.id, 
        project_id: ctx.project.id
      }

      assert {:ok, %Document{} = document} = Projects.create_document(valid_attrs)
      assert document.content == %{}
      assert document.title == "some title"
    end

    test "create_document/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_document(@invalid_attrs)
    end

    test "update_document/2 with valid data updates the document", ctx do
      update_attrs = %{content: %{}, title: "some updated title"}

      assert {:ok, %Document{} = document} = Projects.update_document(ctx.document, update_attrs)
      assert document.content == %{}
      assert document.title == "some updated title"
    end

    test "update_document/2 with invalid data returns error changeset", ctx do
      assert {:error, %Ecto.Changeset{}} = Projects.update_document(ctx.document, @invalid_attrs)
      assert ctx.document == Projects.get_document!(ctx.document.id)
    end

    test "delete_document/1 deletes the document", ctx do
      assert {:ok, %Document{}} = Projects.delete_document(ctx.document)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_document!(ctx.document.id) end
    end

    test "change_document/1 returns a document changeset", ctx do
      assert %Ecto.Changeset{} = Projects.change_document(ctx.document)
    end
  end
end
