defmodule Operately.Search.SourceTest do
  use ExUnit.Case, async: true

  alias Operately.Search.Source

  test "latest_timestamp/1 returns the newest non-nil timestamp" do
    earlier = ~N[2024-01-01 10:00:00]
    later = ~N[2024-06-15 12:30:00]

    assert Source.latest_timestamp([earlier, nil, later]) == later
  end

  test "latest_timestamp/1 returns nil when every timestamp is missing" do
    assert Source.latest_timestamp([]) == nil
    assert Source.latest_timestamp([nil, nil]) == nil
  end

  test "project_state/1 maps closed and paused parent project fields" do
    assert Source.project_state(%{project_closed_at: ~N[2024-01-01 00:00:00], project_status: "active"}) == :closed
    assert Source.project_state(%{project_closed_at: nil, project_status: "closed"}) == :closed
    assert Source.project_state(%{project_closed_at: nil, project_status: "paused"}) == :paused
    assert Source.project_state(%{project_closed_at: nil, project_status: "active"}) == nil
  end
end
