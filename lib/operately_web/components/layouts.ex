defmodule OperatelyWeb.Layouts do
  use OperatelyWeb, :html

  def app_top_padding(assigns) do
    if assigns[:breadcrumbs] do
      "py-28"
    else
      "pt-20"
    end
  end

  embed_templates "layouts/*"
end
