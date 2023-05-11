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
end
