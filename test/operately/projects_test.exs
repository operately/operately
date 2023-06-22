defmodule Operately.ProjectsTest do
  use Operately.DataCase

  alias Operately.Projects

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
      valid_attrs = %{description: "some description", name: "some name"}

      assert {:ok, %Project{} = project} = Projects.create_project(valid_attrs)
      assert project.description == "some description"
      assert project.name == "some name"
    end

    test "create_project/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_project(@invalid_attrs)
    end

    test "update_project/2 with valid data updates the project" do
      project = project_fixture()
      update_attrs = %{description: "some updated description", name: "some updated name"}

      assert {:ok, %Project{} = project} = Projects.update_project(project, update_attrs)
      assert project.description == "some updated description"
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

    test "list_project_milestones/0 returns all project_milestones" do
      milestone = milestone_fixture()
      assert Projects.list_project_milestones() == [milestone]
    end

    test "get_milestone!/1 returns the milestone with given id" do
      milestone = milestone_fixture()
      assert Projects.get_milestone!(milestone.id) == milestone
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

    import Operately.ProjectsFixtures

    @invalid_attrs %{responsibility: nil}

    test "list_project_contributors/0 returns all project_contributors" do
      contributor = contributor_fixture()
      assert Projects.list_project_contributors() == [contributor]
    end

    test "get_contributor!/1 returns the contributor with given id" do
      contributor = contributor_fixture()
      assert Projects.get_contributor!(contributor.id) == contributor
    end

    test "create_contributor/1 with valid data creates a contributor" do
      valid_attrs = %{responsibility: "some responsibility"}

      assert {:ok, %Contributor{} = contributor} = Projects.create_contributor(valid_attrs)
      assert contributor.responsibility == "some responsibility"
    end

    test "create_contributor/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_contributor(@invalid_attrs)
    end

    test "update_contributor/2 with valid data updates the contributor" do
      contributor = contributor_fixture()
      update_attrs = %{responsibility: "some updated responsibility"}

      assert {:ok, %Contributor{} = contributor} = Projects.update_contributor(contributor, update_attrs)
      assert contributor.responsibility == "some updated responsibility"
    end

    test "update_contributor/2 with invalid data returns error changeset" do
      contributor = contributor_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_contributor(contributor, @invalid_attrs)
      assert contributor == Projects.get_contributor!(contributor.id)
    end

    test "delete_contributor/1 deletes the contributor" do
      contributor = contributor_fixture()
      assert {:ok, %Contributor{}} = Projects.delete_contributor(contributor)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_contributor!(contributor.id) end
    end

    test "change_contributor/1 returns a contributor changeset" do
      contributor = contributor_fixture()
      assert %Ecto.Changeset{} = Projects.change_contributor(contributor)
    end
  end

  describe "project_documents" do
    alias Operately.Projects.Document

    import Operately.ProjectsFixtures

    @invalid_attrs %{content: nil, title: nil}

    test "list_project_documents/0 returns all project_documents" do
      document = document_fixture()
      assert Projects.list_project_documents() == [document]
    end

    test "get_document!/1 returns the document with given id" do
      document = document_fixture()
      assert Projects.get_document!(document.id) == document
    end

    test "create_document/1 with valid data creates a document" do
      valid_attrs = %{content: %{}, title: "some title"}

      assert {:ok, %Document{} = document} = Projects.create_document(valid_attrs)
      assert document.content == %{}
      assert document.title == "some title"
    end

    test "create_document/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Projects.create_document(@invalid_attrs)
    end

    test "update_document/2 with valid data updates the document" do
      document = document_fixture()
      update_attrs = %{content: %{}, title: "some updated title"}

      assert {:ok, %Document{} = document} = Projects.update_document(document, update_attrs)
      assert document.content == %{}
      assert document.title == "some updated title"
    end

    test "update_document/2 with invalid data returns error changeset" do
      document = document_fixture()
      assert {:error, %Ecto.Changeset{}} = Projects.update_document(document, @invalid_attrs)
      assert document == Projects.get_document!(document.id)
    end

    test "delete_document/1 deletes the document" do
      document = document_fixture()
      assert {:ok, %Document{}} = Projects.delete_document(document)
      assert_raise Ecto.NoResultsError, fn -> Projects.get_document!(document.id) end
    end

    test "change_document/1 returns a document changeset" do
      document = document_fixture()
      assert %Ecto.Changeset{} = Projects.change_document(document)
    end
  end
end
