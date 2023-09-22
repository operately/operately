defmodule Operately.CommentsFixtures do
  @moduledoc """
  This module defines test helpers for creating
  entities via the `Operately.Comments` context.
  """

  @doc """
  Generate a milestone_comment.
  """
  def milestone_comment_fixture(attrs \\ %{}) do
    {:ok, milestone_comment} =
      attrs
      |> Enum.into(%{
        action: :none
      })
      |> Operately.Comments.create_milestone_comment()

    milestone_comment
  end
end
