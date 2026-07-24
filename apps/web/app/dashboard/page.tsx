import { auth } from "../../auth";
export default async function DashboardPage(){
  const session = await auth()
  return (
    <div>
      Welcome {session?.user?.name}
    </div>
  )
}
