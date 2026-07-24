defmodule Operately.Search.Result do
  @moduledoc """
  Represents one relevance-ranked search result independently of its resource type.

  Search scopes return this shared shape so API and UI consumers can render one
  ordered result list while using `type` and `navigation_target` for navigation.
  """

  @enforce_keys [:id, :type, :title, :context, :matched_field, :navigation_target]
  defstruct [:id, :type, :title, :context, :matched_field, :snippet, :navigation_target]
end
