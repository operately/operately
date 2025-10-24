defmodule OperatelyWeb.EmailPreviews.Preview do
  @moduledoc """
  Wrapper struct that carries the prepared email and the template name.
  """

  @enforce_keys [:email, :template]
  defstruct [:email, :template]
end

