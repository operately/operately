defmodule Operately.I18n.AccessLabels do
  @moduledoc "Localized access labels for presentation; stored access levels remain unchanged."
  use Gettext, backend: OperatelyWeb.Gettext
  alias Operately.Access.Binding

  def label(nil), do: gettext("No Access")

  def label(level) do
    case Binding.label(level) do
      "No Access" -> gettext("No Access")
      "View Access" -> gettext("View Access")
      "Comment Access" -> gettext("Comment Access")
      "Edit Access" -> gettext("Edit Access")
      "Admin Access" -> gettext("Admin Access")
      "Full Access" -> gettext("Full Access")
    end
  end
end
