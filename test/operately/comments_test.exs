defmodule Operately.CommentsTest do
  use Operately.DataCase

  alias Operately.Comments

  describe "milestone_comments" do
    alias Operately.Comments.MilestoneComment

    import Operately.CommentsFixtures

    @invalid_attrs %{action: nil}

    test "list_milestone_comments/0 returns all milestone_comments" do
      milestone_comment = milestone_comment_fixture()
      assert Comments.list_milestone_comments() == [milestone_comment]
    end

    test "get_milestone_comment!/1 returns the milestone_comment with given id" do
      milestone_comment = milestone_comment_fixture()
      assert Comments.get_milestone_comment!(milestone_comment.id) == milestone_comment
    end

    test "create_milestone_comment/1 with valid data creates a milestone_comment" do
      valid_attrs = %{action: :none}

      assert {:ok, %MilestoneComment{} = milestone_comment} = Comments.create_milestone_comment(valid_attrs)
      assert milestone_comment.action == :none
    end

    test "create_milestone_comment/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Comments.create_milestone_comment(@invalid_attrs)
    end

    test "update_milestone_comment/2 with valid data updates the milestone_comment" do
      milestone_comment = milestone_comment_fixture()
      update_attrs = %{action: :complete}

      assert {:ok, %MilestoneComment{} = milestone_comment} = Comments.update_milestone_comment(milestone_comment, update_attrs)
      assert milestone_comment.action == :complete
    end

    test "update_milestone_comment/2 with invalid data returns error changeset" do
      milestone_comment = milestone_comment_fixture()
      assert {:error, %Ecto.Changeset{}} = Comments.update_milestone_comment(milestone_comment, @invalid_attrs)
      assert milestone_comment == Comments.get_milestone_comment!(milestone_comment.id)
    end

    test "delete_milestone_comment/1 deletes the milestone_comment" do
      milestone_comment = milestone_comment_fixture()
      assert {:ok, %MilestoneComment{}} = Comments.delete_milestone_comment(milestone_comment)
      assert_raise Ecto.NoResultsError, fn -> Comments.get_milestone_comment!(milestone_comment.id) end
    end

    test "change_milestone_comment/1 returns a milestone_comment changeset" do
      milestone_comment = milestone_comment_fixture()
      assert %Ecto.Changeset{} = Comments.change_milestone_comment(milestone_comment)
    end
  end
end
