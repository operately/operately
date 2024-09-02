defmodule Operately.Demo.Spaces do
  @moduledoc """
  Create several spaces for the demo.
  """

  def create_spaces(context) do
    {:ok, product_space} = create_space(context, %{
      name: "Product", 
      description: "Build and ship high quality features to our customers", 
      icon: "IconBox", 
      color: "text-blue-500"
    })

    {:ok, people_space} = create_space(context, %{
      name: "People",
      description: "Hiring, internal operations, and employee experience",
      icon: "IconFriends",
      color: "text-yellow-500"
    })

    {:ok, marketing_space} = create_space(context, %{
      name: "Marketing",
      description: "Create product awareness and bring leads",
      icon: "IconSpeakerphone",
      color: "text-pink-500"
    })

    {:ok, legal_space} = create_space(context, %{
      name: "Legal",
      description: "Taking care of the legal side of things. Clarity, compliance, and confidence",
      icon: "IconLifebuoy",
      color: "text-yellow-500"
    })

    {:ok, finance_space} = create_space(context, %{
      name: "Finance",
      description: "Providing accurate and timely financial info and safeguarding company assets",
      icon: "IconReportMoney",
      color: "text-red-500"
    })

    context
    |> Map.put(:company_space, find_company_space(context.company))
    |> Map.put(:product_space, product_space)
    |> Map.put(:people_space, people_space)
    |> Map.put(:marketing_space, marketing_space)
    |> Map.put(:legal_space, legal_space)
    |> Map.put(:finance_space, finance_space)
  end

  defp create_space(context, %{name: name, description: mission, icon: icon, color: color}) do
    Operately.Groups.create_group(context.owner, %{
      name: name,
      mission: mission,
      icon: icon,
      color: color,
      company_permissions: 100,
      public_permissions: 0
    })
  end

  defp find_company_space(company) do
    Operately.Groups.get_group!(company.company_space_id)
  end
end
