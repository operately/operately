defmodule OperatelyWeb.ObjectiveHTML do
  use OperatelyWeb, :html

  import OperatelyWeb.ObjectiveTree

  embed_templates "objective_html/*"
end
