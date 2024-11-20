defmodule Mix.Tasks.Operately.Gen.Typescript.Api do
  def run(_) do
    api = TurboConnect.TsGen.generate(OperatelyWeb.Api)
    File.write!("assets/js/api/index.tsx", api)

    admin_api = TurboConnect.TsGen.generate(OperatelyEE.AdminApi)
    File.write!("assets/js/ee/admin_api/index.tsx", admin_api)
  end
end
