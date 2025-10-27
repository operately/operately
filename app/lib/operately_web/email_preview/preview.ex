defmodule OperatelyWeb.EmailPreview.Preview do
  @moduledoc "Encapsulates the prepared email data used in preview rendering."

  @enforce_keys [:email, :template]
  defstruct [:email, :template]

  def build(email, template) do
    %__MODULE__{
      email: email,
      template: template
    }
  end
end
