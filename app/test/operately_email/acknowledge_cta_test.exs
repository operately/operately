defmodule OperatelyEmail.AcknowledgeCtaTest do
  use ExUnit.Case, async: true

  alias OperatelyEmail.AcknowledgeCta

  @url "https://example.com/item"
  @reviewer %{id: "reviewer"}
  @champion %{id: "champion"}
  @other %{id: "other"}
  @roles [@reviewer, @champion]

  test "reviewer who is not the author gets Acknowledge" do
    assert AcknowledgeCta.build(@reviewer, "champion", @roles, @url, "View Check-In") ==
             {"Acknowledge", @url <> "?acknowledge=true"}
  end

  test "champion who is not the author gets Acknowledge" do
    assert AcknowledgeCta.build(@champion, "reviewer", @roles, @url, "View Check-In") ==
             {"Acknowledge", @url <> "?acknowledge=true"}
  end

  test "champion who is not the author gets Acknowledge even when a third person wrote it" do
    assert AcknowledgeCta.build(@champion, "other", @roles, @url, "View Check-In") ==
             {"Acknowledge", @url <> "?acknowledge=true"}
  end

  test "author never gets Acknowledge, even if they are the reviewer" do
    assert AcknowledgeCta.build(@reviewer, "reviewer", @roles, @url, "View Check-In") ==
             {"View Check-In", @url}
  end

  test "author never gets Acknowledge, even if they are the champion" do
    assert AcknowledgeCta.build(@champion, "champion", @roles, @url, "View Check-In") ==
             {"View Check-In", @url}
  end

  test "anyone else gets the view CTA" do
    assert AcknowledgeCta.build(@other, "champion", @roles, @url, "View Retrospective") ==
             {"View Retrospective", @url}
  end

  test "champion still gets Acknowledge when there is no reviewer" do
    assert AcknowledgeCta.build(@champion, "other", [nil, @champion], @url, "View Check-In") ==
             {"Acknowledge", @url <> "?acknowledge=true"}
  end

  test "roles can be identified by id as well as struct" do
    assert AcknowledgeCta.build(@reviewer, "champion", ["reviewer", "champion"], @url, "View Check-In") ==
             {"Acknowledge", @url <> "?acknowledge=true"}
  end
end
